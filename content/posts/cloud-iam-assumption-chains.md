---
title: Cloud IAM Assumption Chains
slug: cloud-iam-assumption-chains
date: 2026-07-12
category: Cloud
excerpt: How small IAM misconfigurations become tenant-wide impact — role assumption, federation, and why "least privilege" often is not.
thumbnail: images/articles/cloud-iam-assumption-chains.jpg
author: Rehan
author_role: Offensive Operator
tags: [AWS, Azure, IAM, Cloud]
featured: false
read_time: 6 min read
draft: false
---

## The real cloud perimeter

In cloud, the network is optional. **Identity is the control plane.** One over-permissioned role is a lateral movement highway.

## Common chain patterns

### 1. User → role → admin role

Overly broad `sts:AssumeRole` or trust policies that accept too many principals. You never need root if you can become the role that deploys root-adjacent infra.

### 2. CI / OIDC → production

GitHub Actions, Azure DevOps, or GitLab OIDC trusted too widely. A compromised pipeline becomes production credentials.

### 3. Federation abuse

Entra ID / Okta federation into AWS or Azure. Identity provider compromise or mis-scoped claims = multi-cloud blast radius.

## What I look for first

| Signal | Why it matters |
|--------|----------------|
| `*` in actions or resources | Instant privilege graph expansion |
| Trust `Principal: "*"` with weak conditions | Anyone-shaped assume paths |
| Long-lived access keys on humans | Phish → console / CLI |
| Shared admin roles across envs | Dev → prod jump |

## Minimal engagement output

Clients get:

1. Path diagrams (who can become what)
2. Proof of impact without destructive noise
3. Hardening that matches the exploit — not a generic CIS dump

## Closing

Cloud red team without IAM graph work is cosplay. Map trust, chain assume, prove impact, then automate the map.
