# Let Session Orchestrator own Natural Conclusion

Natural Conclusion will be a Session Orchestrator lifecycle decision. The orchestrator may use simple live-session signals such as elapsed time, turn count, practiced material, and whether the conversation has reached a reasonable stopping point, but Voice Runtime and post-session Hidden Evaluation should not decide the product lifecycle.

**Considered Options**

- Let Voice Runtime decide when the conversation should end naturally.
- Let post-session Hidden Evaluation determine after the fact whether the Session should have ended.
- Let Session Orchestrator decide Natural Conclusion from simple lifecycle signals.

**Consequences**

V1 avoids a complex live evaluator just to end the Session politely. Voice Runtime reports conversation/session events, Hidden Evaluation runs after Session end, and Session Orchestrator remains responsible for end reasons and routing.
