---
title: Asynchronous stream iterators and experimental promises for Plone
date: "2014-05-04T06:00:00Z"
tags: ["Async", "Asyncore", "Plone", "Python"]
---

*This post may contain traces of legacy Zope2 and Python 2.x.*

Some may think that [Plone](https://plone.org/) is bad in concurrency,
because it\'s not common to deployt it with
[WSGI](http://en.wikipedia.org/wiki/Web_Server_Gateway_Interface), but
run it on top of a barely known last millennium asynchronous HTTP server
called [Medusa](http://www.nightmare.com/medusa/).

See, The out-of-the-box installation of Plone launches with only a
single asynchronous HTTP server with just two fixed long-running worker
threads. And it\'s way too easy to write custom code to keep those
worker threads busy (for example, by with writing blocking calls to
external services), effectively resulting denial of service for rest of
the incoming requests

Well, as far as I know, the real bottleneck is not Medusa, but the way
how [ZODB](http://en.wikipedia.org/wiki/Zope_Object_Database) database
connections work. It seems that to optimize the database connection
related caches, ZODB is best used with fixed amount of concurrent worker
threads, and one dedicated database connection per thread. Finally,
[MVCC](http://en.wikipedia.org/wiki/Multiversion_concurrency_control) in
ZODB limits each thread can serve only one request at time.

In practice, of course, Plone-sites use ZEO-clustering (and replication)
to overcome the limitations described above.

**Back to the topic (with a disclaimer).** The methods described in this
blog post have not been battle tested yet and they may turn out to be
bad ideas. Still, it\'s been fun to figure out how our old asynchronous
friend, Medusa, could be used to serve more concurrent request in
certain special cases.

ZPublisher stream iterators
---------------------------

If you have been working with Plone long enough, you must have heard the
rumor that blobs, which basically means files and images, are served
from the filesystem in some special non-blocking way.

So, when someone downloads a file from Plone, the current worker thread
only initiates the download and can then continue to serve the next
request. The actually file is left to be served asynchronously by the
main thread.

This is possible because of a ZPublisher feature called *stream
iterators* (search IStreamIterator interface and its implementations in
Zope2 and plone.app.blobs). Stream iterators are basically a way to
postpone I/O-bound operations into the main thread\'s asyncore loop
through a special Medusa-level producer object.

And because stream iterators are consumed only within the main thread,
they come with some very strict limitations:

-   they are executed only after a completed transaction so they cannot
    interact with the transaction anymore
-   they must not read from the ZODB (because their origin connection is
    either closed or in use of their origin worker thread)
-   they must not fail unexpectedly, because you don\'t want to crash
    the main thread
-   they must not block the main thread, for obvious reasons.

Because of these limitations, the stream iterators, as such, are usable
only for the purpose they have been made for: streaming files or similar
immediately available buffers.

Asynchronous stream iterators
-----------------------------

What if you could use ZPublisher\'s stream iterator support also for
CPU-bound post-processing tasks? Or for post-processing tasks requiring
calls to external web services or command-line utilities?

If you have a local Plone instance running somewhere, you can add the
following proof-of-concept code and its `slow_ok`-method into a new
[External
Method](http://docs.zope.org/zope2/zope2book/ScriptingZope.html#using-external-methods)
(also available as a
[gist](https://gist.github.com/datakurre/b273a6bf9285ee779542)):

```python
import StringIO
import threading

from zope.interface import implements
from ZPublisher.Iterators import IStreamIterator
from ZServer.PubCore.ZEvent import Wakeup

from zope.globalrequest import getRequest


class zhttp_channel_async_wrapper(object):
    """Medusa channel wrapper to defer producers until released"""

    def __init__(self, channel):
        # (executed within the current Zope worker thread)
        self._channel = channel

        self._mutex = threading.Lock()
        self._deferred = []
        self._released = False
        self._content_length = 0

    def _push(self, producer, send=1):
        if (isinstance(producer, str)
                and producer.startswith('HTTP/1.1 200 OK')):
            # Fix Content-Length to match the real content length
            # (an alternative would be to use chunked encoding)
            producer = producer.replace(
                'Content-Length: 0\r\n',
                'Content-Length: {0:s}\r\n'.format(str(self._content_length))
            )
        self._channel.push(producer, send)

    def push(self, producer, send=1):
        # (executed within the current Zope worker thread)
        with self._mutex:
            if not self._released:
                self._deferred.append((producer, send))
            else:
                self._push(producer, send)

    def release(self, content_length):
        # (executed within the exclusive async thread)
        self._content_length = content_length
        with self._mutex:
            for producer, send in self._deferred:
                self._push(producer, send)
            self._released = True
        Wakeup()  # wake up the asyncore loop to read our results

    def __getattr__(self, key):
        return getattr(self._channel, key)


class AsyncWorkerStreamIterator(StringIO.StringIO):
    """Stream iterator to publish the results of the given func"""

    implements(IStreamIterator)

    def __init__(self, func, response, streamsize=1 << 16):
        # (executed within the current Zope worker thread)

        # Init buffer
        StringIO.StringIO.__init__(self)
        self._streamsize = streamsize

        # Wrap the Medusa channel to wait for the func results
        self._channel = response.stdout._channel
        self._wrapped_channel = zhttp_channel_async_wrapper(self._channel)
        response.stdout._channel = self._wrapped_channel

        # Set content-length as required by ZPublisher
        response.setHeader('content-length', '0')

        # Fire the given func in a separate thread
        self.thread = threading.Thread(target=func, args=(self.callback,))
        self.thread.start()

    def callback(self, data):
        # (executed within the exclusive async thread)
        self.write(data)
        self.seek(0)
        self._wrapped_channel.release(len(data))

    def next(self):
        # (executed within the main thread)
        if not self.closed:
            data = self.read(self._streamsize)
            if not data:
                self.close()
            else:
                return data
        raise StopIteration

    def __len__(self):
        return len(self.getvalue())


def slow_ok_worker(callback):
    # (executed within the exclusive async thread)
    import time
    time.sleep(1)
    callback('OK')


def slow_ok():
    """The publishable example method"""
    # (executed within the current Zope worker thread)
    request = getRequest()
    return AsyncWorkerStreamIterator(slow_ok_worker, request.response)
```

The above code example simulates a trivial post-processing with
`time.sleep`, but it should apply for anything from building a PDF from
the extracted data to calling an external web service before returning
the final response.

An out-of-the-box Plone instance can handle only two (2) concurrent
calls to a method, which would take one (1) second to complete.

In the above code, however, the post-processing could be delegated to a
completely new thread, freeing the Zope worker thread to continue to
handle the next request. Because of that, we can get much much better
concurrency:

```shell
$ ab -c 100 -n 100 http://localhost:8080/Plone/slow_ok
This is ApacheBench, Version 2.3 <$Revision: 655654 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking localhost (be patient).....done

Server Software:        Zope/(2.13.22,
Server Hostname:        localhost
Server Port:            8080

Document Path:          /Plone/slow_ok
Document Length:        2 bytes

Concurrency Level:      100
Time taken for tests:   1.364 seconds
Complete requests:      100
Failed requests:        0
Write errors:           0
Total transferred:      15400 bytes
HTML transferred:       200 bytes
Requests per second:    73.32 [#/sec] (mean)
Time per request:       1363.864 [ms] (mean)
Time per request:       13.639 [ms] (mean, across all concurrent requests)
Transfer rate:          11.03 [Kbytes/sec] received

Connection Times (ms)
               min  mean[+/-sd] median   max
Connect:        1    2   0.6      2       3
Processing:  1012 1196  99.2   1202    1359
Waiting:     1011 1196  99.3   1202    1359
Total:       1015 1199  98.6   1204    1361

Percentage of the requests served within a certain time (ms)
  50%   1204
  66%   1256
  75%   1283
  80%   1301
  90%   1331
  95%   1350
  98%   1357
  99%   1361
  100%   1361 (longest request)
```

Of course, most of the stream iterator limits still apply: Asynchronous
stream iterator must not access the database, which limits the possible
use cases a lot. For the same reasons, also
[plone.transformchain](https://pypi.python.org/pypi/plone.transformchain)
is effectively skipped (no
[Diazo](https://pypi.python.org/pypi/plone.app.theming) or
[Blocks](https://pypi.python.org/pypi/plone.app.blocks)), which limits
this to be usable only for non-HTML responses.

experimental.promises
---------------------

To go experimenting even further, what if you could do similar
non-blocking asynchronous processing in the middle of a request? For
example, to free the current Zope working thread while fetching a
missing or outdated RSS feed in a separate thread and only then continue
to render the final response.

An interesting side effect of using streaming iterators is that they
allow you to inject code into the main thread\'s asynchronous loop. And
when you are there, it\'s even possible to queue completely new request
for ZPublisher to handle.

So, how would the following approach sound like:

-   let add-on code to annotate requests with
    [promises](http://en.wikipedia.org/wiki/Futures_and_promises) for
    fetching the required data (each promise would be a standalone
    function, which could be executed under the asynchronous stream
    iterator rules, and when called, would resolve into a value,
    effectively the *future* of the promise), for example:

    ```python
    @property
    def content(self):
        if 'my_unique_key' in IFutures(self.request):
            return IFutures(self.request)['my_unique_key']
        else:
            IPromises(self.request)['my_unique_key'] = my_promise_func
            return u''
    ```

-   when promises are found, the response is turned into an asynchronous
    stream iterator, which would then execute all the promises in
    parallel threads and collects the resolved values, futures:

    ```python
    def transformIterable(self, result, encoding):
        if IPromises(self.request):
            return PromiseWorkerStreamIterator(
                IPromises(self.request), self.request, self.request.response)
        else:
            return None
    ```

-   finally, we\'d wrap the current Medusa channel in a way that instead
    of publishing any data yet, a cloned request is queued for the
    ZPublisher (similarly how retries are done after conflict errors),
    but those cloned request and annotated to carry the resolved
    futures:

    ```python
    def next(self):
       if self._futures:
           IFutures(self._zrequest).update(self._futures)
           self._futures = {}  # mark consumed to raise StopIteration

           from ZServer.PubCore import handle
           handle('Zope2', self._zrequest, self._zrequest.response)
       else:
           raise StopIteration
    ```

-   now the add-on code in question would find the futures from request,
    not issue any promises anymore and the request would result a normal
    response pushed all the way to the browser, which initiated the
    original request.

I\'m not sure yet, how good or bad idea this would be, but I\'ve been
tinkering with a proof-of-concept implementation called
[experimental.promises](https://github.com/datakurre/experimental.promises)
to figure it out.

Of course, there are limits and issues to be aware of. Handling the same
request twice is not free, which makes approach effective only when some
significant processing can be moved to be done outside the worker
threads. Also, because there may be other request between the first and
the second pass (freeing the worker to handle other request is the whole
point), the database may change between the passes (kind of breaking the
MVCC promise). Finally, currently it\'s possible write the code always
set new promises and end into never ending loop.

Anyway, if you are interested to try out these approaches (at your own
risk, of course), feel free to ask more via Twitter or IRC.
