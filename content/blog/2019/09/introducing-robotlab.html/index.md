---
title: Introducing RobotLab
date: "2019-09-21T09:00:00Z"
tags: ["robotlab", "robotframework", "testing", "rpa", "robots-from-jupyter", "jupyter"]
---

Say hello to [RobotLab](https://robots-from-jupyter.github.io/)! JupyterLab powered interactive Robot Framework test suite and RPA task suite authoring platform for Windows, MacOS and Linux. Provided for you by the [Robots from Jupyter](https://github.com/robots-from-jupyter) team. Welcome to the era of Robot Framework authoring with fast, fun, and more interactive iterations:

`youtube:https://www.youtube.com/embed/uYGh9_c3b7s`

> ''The biggest criticism against Robot Framework is that it usually requires a complicated installing process.– –After trying up few different setups of Robot Framework combined with variety of GUI (graphical user interface) tools it turned out that there was a much easier way to do it. **By installing Robotlab**– –the user can really focus on the testing  part and not a complicated set up.'' [1]

Our freely downloadable [installers](https://github.com/robots-from-jupyter/robotlab/releases) may look big, but they come with everything to get started, and they do not require Internet connection during install. For any issues with the installers, please, [file an issue](https://github.com/robots-from-jupyter/robotlab/issues).

RobotLab for Linux and MacOS ship with everything required to get started in [Robot Framework powered Selenium testing](https://robots-from-jupyter.github.io/robotkernel/notebooks/05%20Interactive%20Selenium.html). RobotLab for Windows does not stop there, but also includes RobotFramework WhiteLibrary for [Windows application testing and automation](https://robots-from-jupyter.github.io/robotkernel/notebooks/08%20Interactive%20WhiteLibrary.html). Ever seen a Windows automation experience like this? Maybe a bit geeky, but efficient:

`youtube:https://www.youtube.com/embed/zcrJirDX28I`

Background
----------

In January 2018, the first Robot Framework conference was held in Helsinki, Finland. I wanted a fun topic for the sprints after the conference and started learning IPython kernel development. The very first version of [RobotKernel](https://pypi.org/project/robotkernel/), my Robot Framework IPython kernel for Jupyter integration, was working already before the end of the sprints:

`youtube:https://www.youtube.com/embed/kgLVioHZTgA`

Later in 2018, while I was too focused on other projects, Nicholas Bollweg found my RobotKernel and rebuilt its ideas and more into [irobotframework](https://github.com/gtri/irobotframework) Jupyter kernel for his employer. Once I learned from Nick about all the low hanging fruits I missed and the new features in [JupyterLab](https://jupyterlab.readthedocs.io/en/stable/), I couldn't resist returning to work on RobotKernel.

Eventually, we decided to work together and propose a presentation and a workshop for the next RoboCon, in January 2019. Plan for the workshop, however, raised a question: How do we ensure that each participant of the workshop will have a working environment right from the start? Nick decided to solve that issue by building a standalone installer on top the shoulders of [Conda](https://docs.conda.io/en/latest/).

That installer become RobotLab. [And now you can have it too.](https://robots-from-jupyter.github.io/)

[1]: http://urn.fi/URN:NBN:fi:amk-201905109178 "Rautavesi T. 2019. Test automation as a part of agile software development."
