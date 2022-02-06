---
title: Having fun at open-source automation playground
date: "2022-02-04T12:00:00Z"
tags: ["camunda", "robocorp", "robot framework", "python", "rpa", "open source"]
---

Successful business process automation requires ability to iterate on the automation part.
During the last year, I went through many ideas and iterations on how to make [Camunda Platform](https://camunda.com/download/) BPMN [external service task handlers](https://docs.camunda.org/manual/latest/user-guide/process-engine/external-tasks/) more convenient to implement and execute – especially in Python or [Robot Framework](https://robotframework.org/rpa/).
By the end of the year, I surprised myself by settling down on a quickish solution based on [Robocorp RCC](https://robocorp.com/docs/rcc/overview):  my very own [carrot-rcc](https://pypi.org/project/carrot-rcc/).


Standing on the shoulders…
--------------------------

After struggling in mapping many Camunda or BPMN concepts to Robot Framework, I seem to have learned the best answer being simply: **do not**.

**What if** one could just go to [Camunda provided documentation](https://camunda.com/best-practices/_/) to learn about process modelling and [Robocorp provided documentation](https://robocorp.com/docs/) to learn about RPA and automation. Then use their tools to iterate on both, and eventually everything would just work.

That's [what carrot-rcc is about](../../../2021/08/carrot-rcc/). **It works as a bridge between Camunda Platform external service task and Robocorp style Python or Robot Framework code package.** It converts Camunda Platform process task state into Robocorp style work item, and then uses Robocorp RCC to execute the robot package for it (by matching external task topic to robot task name). Finally, the external task state is updated from the saved work item, and then the task is either completed or mark failed.

So, it seems that with their [work item concept](https://robocorp.com/docs/development-guide/control-room/work-items) Robocorp has already figured out necessary abstractions


