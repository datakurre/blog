---
title: Too many ways to do async tasks with Plone
date: "2014-10-23T06:00:00Z"
tags: ["async", "asyncore", "futures", "medusa", "plone", "promises", "RabbitMQ"]
---

Triggering asynchronous tasks from [Plone](http://plone.org/) is hard,
we hear. And that\'s actually quite surprising, given that, from its
very beginning, Plone has been running on top of the first asynchronous
web server written in Python,
[medusa](http://www.nightmare.com/medusa/).

Of course, there exist many, too many, different solutions to run
asynchronous task with Plone:

-   [plone.app.async](https://pypi.python.org/pypi/plone.app.async) is
    the only one in Plone-namespace, and probably the most criticized
    one, because of using ZODB to persist its task queue
-   [netsight.async](https://pypi.python.org/pypi/netsight.async) on the
    other hand being simpler by just executing the the given task
    outside Zope worker pool (but requiring its own database
    connection).
-   finally, if you happen to like Celery, Nathan Van Gheem is working
    on a simple Celery-integration,
    [collective.celery](https://github.com/collective/collective.celery),
    based on an earlier work by David Glick.

To add insult to injury, I\'ve ended up developing a more than one
method more, because of, being warned about plone.app.async, being hit
hard by the opinionated internals of Celery, being unaware of
netsight.async, and because single solution has not fit all my use
cases.

I believe, my various use cases can mostly be fit into these categories:

-   Executing simple tasks with unpredictable execution time so that the
    execution cannot block all of the valuable Zope worker threads
    serving HTTP requests (amount of threads is fixed in Zope, because
    ZODB connection cached cannot be shared between simultaneous
    requests and one can afford only so much server memory per site).

    Examples: communicating to external services, loading an external
    RSS feed, \...

-   Queueing a lot of background tasks to be executed now or later,
    because possible results can be delivered asynchronously (e.g. user
    can return to see it later, can get notified about finished tasks,
    etc), or when it would benefit to be able to distribute the work
    between multiple Zope worker instances.

    Examples: converting files, encoding videos, burning PDFs, sending a
    lot of emails, \...

-   Communicating with external services.

    Examples: integration between sites or different systems,
    synchronizing content between sites, performing migrations, \...

For further reading about all the possible issues when queing
asynchronous tasks, I\'d recommend [Whichert Akkermans\' blog post about
task queues](http://www.wiggy.net/articles/task-queues).

So, here\'s the summary, from my most simple approach solution to
enterprise messaging with RabbitMQ:

ZPublisher stream iterator workers
----------------------------------

```python
class MyView(BrowserView):

    def __call__(self):
        return AsyncWorkerStreamIterator(some_callable, self.request)
```

I\'ve already blogged earlier in detail about [how to abuse
ZPublisher\'s stream iterator interface to free the current Zope worker
thread](http://datakurre.pandala.org/2014/05/asynchronous-stream-iterators-and.html)
and process the current response outside Zope worker threads before
letting the response to continue its way towards the requesting client
(browser).

An example of this trick is a yet another zip-export add-on
[collective.jazzport](https://pypi.python.org/pypi/collective.jazzport).
It exports Plone-folders as zip-files by downloading all those
to-be-zipped files separately simply through ZPublisher (or, actually,
using site\'s public address). It can also download files in parallel to
use all the available load balanced instances. Yet, because it downloads
files only after freeing the current Zope worker instance, it should not
block any worker thread by itself (see its
[browser.py](https://github.com/datakurre/collective.jazzport/blob/master/src/collective/jazzport/browser.py),
and
[iterators.py](https://github.com/datakurre/collective.jazzport/blob/master/src/collective/jazzport/iterators.py)).

There are two major limitations for this approach (common to all
ZPublisher stream iterators):

-   The code should not access ZODB after the worker thread has been
    freed (unless a completely new connection with new cache is
    created).
-   This does not help installations with HAProxy or similar front-end
    proxy with fixed allowed simultaneous requests per Zope instance.

Also, of course, this is not real async, because it keeps the client
waiting until the request is completed and cannot distribute work
between Zope instances.

[collective.futures](https://pypi.python.org/pypi/collective.futures)
---------------------------------------------------------------------

```python
class MyView(BrowserView):

    def __call__(self):
        try:
            return futures.result('my_unique_key')
        except futures.FutureNotSubmittedError:
            futures.submit('my_unique_key', some_callable, 'foo', 'bar')
            return u'A placeholder value, which is never really returned.'
```

**collective.futures** was the next step from the previous approach. It
provides a simple API for registering multiple tasks (which does not
need to access ZODB) so that they will be executed outside the current
Zope worker thread.

Once all the registered tasks have been executed, the same request will
be queued for ZPublisher to be processed again, now with the responses
from those registered tasks.

Finally, the response will be returned for the requesting like with any
other requests.

**collective.futures** has the same issues as the previous approach
(used in
[collective.jazzport](https://pypi.python.org/pypi/collective.jazzport)),
and it may also waste resources by processing certain parts of the
request twice (like publish traverse).

We use this, for example, for loading external RSS feeds so that the
Zope worker threads are freed to process other requests while we are
waiting the external services to return us those feeds.

[collective.taskqueue](https://pypi.python.org/pypi/collective.taskqueue)
-------------------------------------------------------------------------

```python
class MyView(BrowserView):

    def __call__(self):
        taskqueue.add('/Plone/path/to/some/other/view')
        return u'Task queued, and a better view could now display a throbber.'
```

**collective.taskqueue** should be a real alternative for
[plone.app.async](https://pypi.python.org/pypi/plone.app.async) and
[netsight.async](https://pypi.python.org/pypi/netsight.async). I see it
as a simple and opinionated sibling of
[collective.zamqp](https://pypi.python.org/pypi/collective.zamqp), and
it should be able to handle all the most basic asynchrnous tasks where
no other systems are involved.

**collective.taskqueue** provides one or more named asynchronously
consumed task queues, which may contain any number of tasks:
asynchronously dispatched simple requests to any traversable resources
in Plone.

With out-of-the-box Plone (without any other add-ons or external
services) it provides instance local volatile memory based task queues,
which are consumed by the other one of the default two Zope worker
threads. With [redis](http://redis.io/), it supports persistent task
queues with quaranteed delivery and distributed consumption. For
example, you could have dedicated Plone instances to only consume those
shared task queues from Redis.

To not sound too good to be true, **collective.taskqueue** does not have
any nind of monitoring of the task queues out-of-the-box (only a
instance-Z2.log entry with resulted status code for each consumed task
is generated).

[collective.zamqp](https://pypi.python.org/pypi/collective.zamqp)
-----------------------------------------------------------------

```python
class MyView(BrowserView):

    def __call__(self):
        producer = getUtility(IProducer, name='my.asyncservice')
        producer.register()  # bind to successful transaction
        producer.publish({'title': u'My title'})
        return u'Task queued, and a better view could now display a throbber.'
```

Finally, **collective.zamqp** is a very flexible asynchronous framework
and [RabbitMQ](http://www.rabbitmq.com/) integration for Plone, which I
re-wrote from
[affinitic.zamqp](https://pypi.python.org/pypi/affinitic.zamqp) before
figuring out any of the previous approaches.

As the story behind it goes, we did use **affinitic.zamqp** at first,
but because of its issues we had to start rewrite to make it more stable
and compatible with newer AMQP specifications. At first, I tried to
built it on top of Celery, then on top of Kombu (transport framework
behind Celery), but at the end it had to be based directly on top of
[pika](https://pypi.python.org/pypi/pika) (0.9.4), a popular Python AMQP
library. Otherwise it would have been really difficult to benefit from
all the possible features of RabbitMQ and be compatible with other that
Python based services.

**collective.zamqp** is best used for configuring and executing
asynchronous messaging between Plone sites, other Plone sites and other
AMQP-connected services. It\'s also possible to use it to build frontend
messaging services (possibly secured using SSL) with RabbitMQ\'s
webstomp server (see the
[chatbehavior](https://github.com/datakurre/chatbehavior)-example). Yet,
it has a few problems of its own:

-   it depends on five.grok
-   it\'s way too tighly integrated with pika 0.9.5, which makes
    upgrading the integration more difficult than necessary (and pika
    0.9.5 has a few serious bugs related to synchronous AMQP
    connections, luckily not requird for c.zamqp)
-   it has a quite bit of poorly documented magic in how to use it to
    make all the possible AMQP messaging configurations.

**collective.zamqp** does not provide monitoring utilities of its own
(beyond very detailed logging of messaging events). Yet, the basic
monitoring needs can be covered with RabbitMQ\'s web and console UIs and
RESTful APIs, and all decent monitoring tools should have their own
RabbitMQ plugins.

For more detailed examples of **collective.zamqp**, please, see [my
related StackOverflow
answer](http://stackoverflow.com/questions/24636315/using-rabbitmq-with-plone-celery-or-not)
and [our presentation from PloneConf
2012](http://www.slideshare.net/datakurre/plone-rabbit-mq-and-messaging-that-just-works)
(more examples are linked from the last slide).
