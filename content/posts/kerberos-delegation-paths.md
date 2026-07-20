---
title: Kerberos Delegation Paths That Still Work
slug: kerberos-delegation-paths
date: 2026-07-10
category: Identity
excerpt: Unconstrained, constrained, and resource-based constrained delegation — how operators still chain identity paths when the domain looks "hardened."
thumbnail: images/articles/kerberos-delegation-paths.jpg
author: Rehan
author_role: Offensive Operator
tags: [AD, Kerberos, Identity, Red Team]
featured: true
read_time: 7 min read
draft: false
---

## Why identity still wins

Most environments fix the scanner findings and leave the **trust graph** alone. Kerberos is that graph. If you can influence who can act as whom, you own the path.

This note is a practical operator view — not a textbook recap.

## Three shapes of abuse

### Unconstrained delegation

Classic. Host gets a TGT for anyone who authenticates to it. Compromise the host, pull tickets from memory, move as those principals.

Still shows up on:

- Legacy print / file servers
- Jump boxes nobody re-audited
- "Temporary" systems that became permanent

### Constrained delegation

S4U2Self + S4U2Proxy when the service is allowed to present to a limited set of SPNs. Mis-scoped SPNs turn "limited" into "enough."

### Resource-based constrained delegation (RBCD)

The target object controls who may impersonate to it. Write access on a computer object (or a path to get it) becomes a foothold → DA style pivot without classic unconstrained flags.

## Operator checklist

```text
1. Map: who has GenericWrite / WriteDACL on computer objects?
2. Find: msDS-AllowedToActOnBehalfOfOtherIdentity
3. Abuse: create a fake machine account (if MachineAccountQuota allows)
4. Request: S4U tickets as high-value user to the target SPN
5. Land: winrm / cifs / mssql as the impersonated principal
```

## Defenses that actually matter

- Audit **RBCD** ACLs and machine account quota
- Prefer gMSA / protected users for high-value accounts
- Monitor S4U ticket anomalies, not only "failed logons"
- Kill unconstrained delegation; treat remaining hosts as tier-0 adjacent

## Bottom line

Scanner green ≠ identity safe. Walk the delegation graph like an adversary — then automate the boring parts of that walk into tooling.
