import os
from datetime import datetime
from typing import Dict, List, Any

class ReportingEngine:
    """
    A utility class to format and export structured security findings
    into professional Markdown reports.
    """

    def __init__(self, output_dir: str = "reports"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_report(self, target: str, findings: List[Dict[str, Any]], assessment_details: Dict[str, Any] = None) -> str:
        """
        Generates a professional Markdown security report from a list of findings.
        """
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        date_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"security_report_{target.replace('.', '_')}_{date_str}.md"
        filepath = os.path.join(self.output_dir, filename)

        # Standard meta details
        title = assessment_details.get("title", "Security Assessment Report") if assessment_details else "Security Assessment Report"
        version = assessment_details.get("version", "1.0") if assessment_details else "1.0"
        author = assessment_details.get("author", "Security Consultant") if assessment_details else "Security Consultant"

        # Count severities
        severity_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
        for f in findings:
            sev = f.get("severity", "Low").capitalize()
            if sev in severity_counts:
                severity_counts[sev] += 1
            else:
                severity_counts["Low"] += 1

        lines = [
            f"# {title}",
            "",
            "## Executive Summary",
            f"- **Target Asset:** {target}",
            f"- **Assessment Date:** {timestamp}",
            f"- **Report Version:** {version}",
            f"- **Prepared By:** {author}",
            "",
            "### Vulnerability Distribution Summary",
            "| Severity | Count |",
            "| --- | --- |",
            f"| 🔴 Critical | {severity_counts['Critical']} |",
            f"| 🟠 High | {severity_counts['High']} |",
            f"| 🟡 Medium | {severity_counts['Medium']} |",
            f"| 🔵 Low | {severity_counts['Low']} |",
            "",
            "---",
            "",
            "## Detailed Findings",
            ""
        ]

        for i, finding in enumerate(findings, start=1):
            name = finding.get("name", "Unnamed Vulnerability")
            severity = finding.get("severity", "Low").upper()
            description = finding.get("description", "No description provided.")
            affected = finding.get("affected_components", "N/A")
            scenario = finding.get("attack_scenario", "N/A")
            impact = finding.get("business_impact", "N/A")
            references = finding.get("references", [])
            remediation = finding.get("remediation", "No remediation steps provided.")
            verification = finding.get("verification_method", "No verification method provided.")

            # Assign color icon based on severity
            icon = "🔵"
            if severity == "CRITICAL":
                icon = "🔴"
            elif severity == "HIGH":
                icon = "狠" # Using orange block or similar
                icon = "🟠"
            elif severity == "MEDIUM":
                icon = "🟡"

            lines.extend([
                f"### {i}. {icon} [{severity}] {name}",
                "",
                f"**Affected Components:** {affected}",
                "",
                "#### Description",
                description,
                "",
                "#### Attack Scenario",
                scenario,
                "",
                "#### Business Impact",
                impact,
                "",
            ])

            if references:
                ref_str = ", ".join(references) if isinstance(references, list) else references
                lines.append(f"**References:** {ref_str}")
                lines.append("")

            lines.extend([
                "#### Remediation Steps",
                remediation,
                "",
                "#### Verification Method",
                verification,
                "",
                "---",
                ""
            ])

        # Write to file
        with open(filepath, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))

        return filepath

# Example test setup if run directly
if __name__ == "__main__":
    engine = ReportingEngine()
    test_findings = [
        {
            "name": "Outdated TLS Version Allowed",
            "severity": "Medium",
            "description": "The server supports TLS 1.0 and TLS 1.1 protocol versions, which are deprecated and contain known cryptographic weaknesses.",
            "affected_components": "Web Server TLS configuration (port 443)",
            "attack_scenario": "An attacker positioned on the network paths between the client and server could potentially intercept and decrypt the transmission session.",
            "business_impact": "Exposure of sensitive customer data in transit; non-compliance with PCI DSS guidelines.",
            "references": ["RFC 8996", "CWE-327"],
            "remediation": "Disable support for TLS 1.0 and TLS 1.1 in the server configuration. Enforce TLS 1.2 or TLS 1.3.",
            "verification_method": "Run `nmap --script ssl-enum-ciphers -p 443 <target>` and verify deprecated versions are not negotiated."
        }
    ]
    path = engine.generate_report("example.com", test_findings)
    print(f"Generated test report at: {path}")
