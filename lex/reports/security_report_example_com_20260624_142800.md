# Security Assessment Report

## Executive Summary
- **Target Asset:** example.com
- **Assessment Date:** 2026-06-24 14:28:00
- **Report Version:** 1.0
- **Prepared By:** Security Consultant

### Vulnerability Distribution Summary
| Severity | Count |
| --- | --- |
| 🔴 Critical | 0 |
| 🟠 High | 0 |
| 🟡 Medium | 1 |
| 🔵 Low | 0 |

---

## Detailed Findings

### 1. 🟡 [MEDIUM] Outdated TLS Version Allowed

**Affected Components:** Web Server TLS configuration (port 443)

#### Description
The server supports TLS 1.0 and TLS 1.1 protocol versions, which are deprecated and contain known cryptographic weaknesses.

#### Attack Scenario
An attacker positioned on the network paths between the client and server could potentially intercept and decrypt the transmission session.

#### Business Impact
Exposure of sensitive customer data in transit; non-compliance with PCI DSS guidelines.

**References:** RFC 8996, CWE-327

#### Remediation Steps
Disable support for TLS 1.0 and TLS 1.1 in the server configuration. Enforce TLS 1.2 or TLS 1.3.

#### Verification Method
Run `nmap --script ssl-enum-ciphers -p 443 <target>` and verify deprecated versions are not negotiated.

---
