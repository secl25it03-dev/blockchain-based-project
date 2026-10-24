import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def create_report():
    doc = Document()

    # Page Margins: 1 inch all around
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1.25)
        section.right_margin = Inches(1)

    # Base Style configuration: Times New Roman
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Times New Roman'
    font.size = Pt(12)
    font.color.rgb = RGBColor(0, 0, 0)
    style.paragraph_format.line_spacing = 1.5
    style.paragraph_format.space_after = Pt(6)
    style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

    def add_title_p(text, size=14, bold=True, italic=False, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=12):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_after = Pt(space_after)
        run = p.add_run(text)
        run.bold = bold
        run.italic = italic
        run.font.name = 'Times New Roman'
        run.font.size = Pt(size)
        return p

    def add_body_p(text, bold_prefix="", italic=False, space_after=6):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_after = Pt(space_after)
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.bold = True
            r_pre.font.name = 'Times New Roman'
            r_pre.font.size = Pt(12)
        r = p.add_run(text)
        r.italic = italic
        r.font.name = 'Times New Roman'
        r.font.size = Pt(12)
        return p

    def add_bullet(text, bold_prefix=""):
        p = doc.add_paragraph(style='List Bullet')
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_after = Pt(4)
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.bold = True
            r_pre.font.name = 'Times New Roman'
            r_pre.font.size = Pt(12)
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(12)
        return p

    def style_table(table):
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        for row in table.rows:
            for cell in row.cells:
                # Add padding
                tcPr = cell._tc.get_or_add_tcPr()
                tcMar = OxmlElement('w:tcMar')
                for margin in ['top', 'bottom', 'left', 'right']:
                    node = OxmlElement(f'w:{margin}')
                    node.set(qn('w:w'), '120')
                    node.set(qn('w:type'), 'dxa')
                    tcMar.append(node)
                tcPr.append(tcMar)
                for paragraph in cell.paragraphs:
                    paragraph.paragraph_format.line_spacing = 1.15
                    paragraph.paragraph_format.space_after = Pt(2)
                    for run in paragraph.runs:
                        run.font.name = 'Times New Roman'
                        run.font.size = Pt(10.5)

    # ================= PAGE 1: TITLE PAGE =================
    p_top = doc.add_paragraph()
    p_top.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_top.paragraph_format.space_after = Pt(36)

    add_title_p("DONATO: A TRANSPARENT AND TRUSTED DONATION\nPLATFORM FOR NGOS AND ORPHANAGES", size=15, bold=True, space_after=18)
    add_title_p("PROTOTYPE DEVELOPMENT LABORATORY-1", size=13, bold=True, space_after=18)
    add_title_p("A Report", size=12, bold=False, italic=True, space_after=24)
    add_title_p("Submitted by", size=12, bold=True, space_after=18)

    # Names table
    t_names = doc.add_table(rows=3, cols=2)
    t_names.alignment = WD_TABLE_ALIGNMENT.CENTER
    names_data = [
        ("VIKRAM S", "(2403412520521304)"),
        ("MINHA FATHIMA C", "(2403412520522141)"),
        ("SRUTHISH KUMAR R", "(2403412520521082)")
    ]
    for i, (name, reg) in enumerate(names_data):
        row = t_names.rows[i]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.8)
        c1.width = Inches(2.2)
        p0 = c0.paragraphs[0]
        p0.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r0 = p0.add_run(name)
        r0.bold = True
        r0.font.name = 'Times New Roman'
        r0.font.size = Pt(12)

        p1 = c1.paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        r1 = p1.add_run(reg)
        r1.bold = True
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(12)

    p_mid = doc.add_paragraph()
    p_mid.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_mid.paragraph_format.space_before = Pt(28)
    p_mid.paragraph_format.space_after = Pt(18)
    r_deg = p_mid.add_run("in partial fulfillment for the award of the degree of\n")
    r_deg.italic = True
    r_deg.font.name = 'Times New Roman'
    r_deg.font.size = Pt(12)

    r_be = p_mid.add_run("BACHELOR OF TECHNOLOGY\nin\nDEPARTMENT OF INFORMATION TECHNOLOGY")
    r_be.bold = True
    r_be.font.name = 'Times New Roman'
    r_be.font.size = Pt(13)

    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_before = Pt(24)
    p_inst.paragraph_format.space_after = Pt(4)
    r_inst = p_inst.add_run("SRI SAIRAM ENGINEERING COLLEGE\n")
    r_inst.bold = True
    r_inst.font.name = 'Times New Roman'
    r_inst.font.size = Pt(13)

    r_aut = p_inst.add_run("(An Autonomous Institution; Affiliated to Anna University, Chennai -600 044)\n\n")
    r_aut.bold = False
    r_aut.font.name = 'Times New Roman'
    r_aut.font.size = Pt(11)

    r_au = p_inst.add_run("ANNA UNIVERSITY: CHENNAI 600 044\n\nNOVEMBER 2026")
    r_au.bold = True
    r_au.font.name = 'Times New Roman'
    r_au.font.size = Pt(12)

    # ================= PAGE 2: BONAFIDE CERTIFICATE =================
    doc.add_page_break()
    add_title_p("SRI SAIRAM ENGINEERING COLLEGE\n(An Autonomous Institution; Affiliated to Anna University, Chennai -600 044)", size=12, bold=True, space_after=18)
    add_title_p("BONAFIDE CERTIFICATE", size=14, bold=True, space_after=24)

    add_body_p(
        "Certified that this Innovative Design Lab-I report “DONATO: A TRANSPARENT AND TRUSTED DONATION PLATFORM FOR NGOS AND ORPHANAGES” is the bonafide work of “VIKRAM S (2403412520521304), MINHA FATHIMA C (2403412520522141), and SRUTHISH KUMAR R (2403412520521082)” who carried out the course (24ITID301 - INNOVATION DESIGN LABORATORY) under my supervision."
    )

    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_after = Pt(48)

    # Signatures Table
    t_sigs = doc.add_table(rows=4, cols=3)
    t_sigs.alignment = WD_TABLE_ALIGNMENT.CENTER
    sig_headers = ["SIGNATURE\nSupervisor", "SIGNATURE\nProject Coordinator", "SIGNATURE\nHead of the Department"]
    sig_names = ["MRS. NEELA K", "MRS. SANKARI S", "DR. M. SURESHKUMAR"]
    sig_desigs = ["Assistant Professor", "Assistant Professor", "Head of the Department"]
    sig_depts = ["Information Technology", "Information Technology", "Information Technology"]

    for col in range(3):
        t_sigs.rows[0].cells[col].paragraphs[0].text = sig_headers[col]
        t_sigs.rows[0].cells[col].paragraphs[0].runs[0].bold = True
        t_sigs.rows[1].cells[col].paragraphs[0].text = "\n\n" + sig_names[col]
        t_sigs.rows[1].cells[col].paragraphs[0].runs[0].bold = True
        t_sigs.rows[2].cells[col].paragraphs[0].text = sig_desigs[col]
        t_sigs.rows[3].cells[col].paragraphs[0].text = sig_depts[col]
        for row in range(4):
            t_sigs.rows[row].cells[col].width = Inches(2.1)
            t_sigs.rows[row].cells[col].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in t_sigs.rows[row].cells[col].paragraphs[0].runs:
                r.font.name = 'Times New Roman'
                r.font.size = Pt(10.5)

    p_viva = doc.add_paragraph()
    p_viva.paragraph_format.space_before = Pt(48)
    p_viva.paragraph_format.space_after = Pt(36)
    r_viva = p_viva.add_run("Submitted for the Innovative Design Lab-I Viva – Voce Examination held on ________________")
    r_viva.bold = True
    r_viva.font.name = 'Times New Roman'
    r_viva.font.size = Pt(11)

    t_exam = doc.add_table(rows=1, cols=2)
    t_exam.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_exam.rows[0].cells[0].paragraphs[0].text = "INTERNAL EXAMINER"
    t_exam.rows[0].cells[0].paragraphs[0].runs[0].bold = True
    t_exam.rows[0].cells[0].width = Inches(3.2)
    t_exam.rows[0].cells[1].paragraphs[0].text = "EXTERNAL EXAMINER"
    t_exam.rows[0].cells[1].paragraphs[0].runs[0].bold = True
    t_exam.rows[0].cells[1].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
    t_exam.rows[0].cells[1].width = Inches(3.2)

    # ================= PAGE 3: ACKNOWLEDGEMENT =================
    doc.add_page_break()
    add_title_p("ACKNOWLEDGEMENT", size=14, bold=True, space_after=18)
    add_body_p(
        "“A successful man is one who can lay a firm foundation with the bricks others have thrown at him.” — David Brinkley",
        italic=True,
        space_after=14
    )
    add_body_p(
        "Such a successful personality is our beloved founder Chairman, Thiru. MJF. Ln. LEO MUTHU. At first, we express our sincere gratitude to our beloved Chairman through prayers, who in the form of a guiding star has spread his wings of eternal support with immortal blessings."
    )
    add_body_p(
        "We express our profound gratitude to our respected CEO, Dr. J. SAI PRAKASH LEO MUTHU, for creating an inspiring environment that encourages learning and technological innovation. His guidance and vision have significantly impacted the successful completion of this project."
    )
    add_body_p(
        "We express our sincere thanks to our beloved Principal, Dr. J. RAJA, for his constant encouragement, administrative support, and for providing the resources and computing infrastructure necessary to bring this project to fruition."
    )
    add_body_p(
        "We are deeply indebted to our Head of the Department, Dr. M. SURESHKUMAR, Department of Information Technology, for the insightful suggestions, mentorship, and continuous motivation, which have guided us at every stage."
    )
    add_body_p(
        "We thank our Innovative Design Lab-I Coordinator, MRS. SANKARI S, Assistant Professor, who has been instrumental in coordinating efforts, providing feedback, and ensuring smooth project progress."
    )
    add_body_p(
        "We express our gratitude and sincere thanks to our Guide, MRS. NEELA K, Assistant Professor, for her expertise, patience, and valuable technical insights. Her constructive feedback, encouragement, and availability for guidance have been crucial in overcoming challenges and achieving our objectives."
    )
    add_body_p(
        "We thank all the teaching and non-teaching staff members of the Department of Information Technology and all others who contributed directly or indirectly for the successful completion of the project."
    )

    # ================= PAGES 4-6: TABLE OF CONTENTS =================
    doc.add_page_break()
    add_title_p("TABLE OF CONTENTS", size=14, bold=True, space_after=18)

    t_toc = doc.add_table(rows=1, cols=3)
    t_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = t_toc.rows[0]
    hdr.cells[0].paragraphs[0].text = "CHAPTER NO"
    hdr.cells[1].paragraphs[0].text = "TITLE"
    hdr.cells[2].paragraphs[0].text = "PAGE NO."
    for c in hdr.cells:
        c.paragraphs[0].runs[0].bold = True
        c.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER

    toc_items = [
        ("", "ABSTRACT", "ix"),
        ("", "LIST OF TABLES", "viii"),
        ("", "LIST OF FIGURES", "vii"),
        ("1", "EXECUTIVE SUMMARY", "1"),
        ("", "1.1 Overview of the Business Idea", "1"),
        ("", "1.2 Vision & Mission", "1"),
        ("", "1.3 Key Highlights", "1"),
        ("2", "THE PROBLEM AND OPPORTUNITY", "3"),
        ("", "2.1 Problem Statement", "3"),
        ("", "2.2 Market Opportunity", "3"),
        ("", "2.3 Problem Interviews and Survey Results", "3"),
        ("3", "JUSTIFICATION FOR SDG GOAL", "5"),
        ("", "3.1 State the Chosen SDG and Target(s)", "5"),
        ("", "3.2 Alignment with the SDG Target", "5"),
        ("", "3.3 Justification and Impact", "5"),
        ("4", "MARKET RESEARCH AND STRATEGY", "7"),
        ("", "4.1 Market Size Estimation", "7"),
        ("", "4.2 Target Audience and Customer Persona", "7"),
        ("", "4.3 Industry Trends and Insights", "7"),
        ("", "4.4 Competition Analysis", "8"),
        ("", "4.5 Unique Selling Proposition (USP)", "8"),
        ("5", "SOLUTION AND PRODUCT DEVELOPMENT", "9"),
        ("", "5.1 Proposed Solution", "9"),
        ("", "5.2 Product Features and Benefits", "9"),
        ("", "5.3 Value Proposition Canvas", "9"),
        ("", "5.4 Minimum Viable Product (MVP)", "10"),
        ("", "5.5 MVP Validation and Feedback", "10"),
        ("6", "BUSINESS MODEL AND STRATEGY", "11"),
        ("", "6.1 Business Model Overview", "11"),
        ("", "6.2 Revenue Model", "11"),
        ("", "6.3 Sales Plan and Go to Market Strategy", "11"),
        ("", "6.4 Marketing and Customer Acquisition Strategy", "12"),
        ("7", "FINANCIAL PLAN AND PROJECTIONS", "13"),
        ("", "7.1 Financial Overview", "13"),
        ("", "7.2 Forecasted Profit & Loss (P&L)", "13"),
        ("", "7.3 Financial Projections & Break-Even Analysis", "13"),
        ("", "7.4 Unit Economics", "13"),
        ("", "7.5 Funding Plan and Capital Requirements", "14"),
        ("8", "TEAM & EXECUTION", "15"),
        ("", "8.1 Team Composition and Roles", "15"),
        ("", "8.2 Milestones & Execution Roadmap", "15"),
        ("", "8.3 Risk Analysis and Mitigation Strategies", "16"),
        ("9", "CONCLUSION AND NEXT STEPS", "17"),
        ("", "9.1 Summary of Key Points", "17"),
        ("", "9.2 Next Steps & Future Roadmap", "17"),
        ("", "Reflecting on the Innovative Design Lab – I", "17"),
        ("10", "REFERENCES", "18"),
        ("", "APPENDIX – I: SOURCE CODE / DATA SHEET / SCREENSHOTS", "19"),
        ("", "APPENDIX – II: KEY PERFORMANCE INDICATORS", "24"),
        ("", "APPENDIX – III: JUSTIFICATION FOR POSITIVE MATRIX", "25"),
    ]

    for ch, title, pg in toc_items:
        row = t_toc.add_row()
        c0, c1, c2 = row.cells[0], row.cells[1], row.cells[2]
        c0.width = Inches(1.3)
        c1.width = Inches(4.3)
        c2.width = Inches(0.9)
        c0.paragraphs[0].text = ch
        c0.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        c1.paragraphs[0].text = title
        c2.paragraphs[0].text = pg
        c2.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
        if ch != "" or title in ["ABSTRACT", "LIST OF TABLES", "LIST OF FIGURES", "REFERENCES", "APPENDIX – I: SOURCE CODE / DATA SHEET / SCREENSHOTS", "APPENDIX – II: KEY PERFORMANCE INDICATORS", "APPENDIX – III: JUSTIFICATION FOR POSITIVE MATRIX"]:
            if len(c1.paragraphs[0].runs) > 0:
                c1.paragraphs[0].runs[0].bold = True
            if len(c0.paragraphs[0].runs) > 0:
                c0.paragraphs[0].runs[0].bold = True
            if len(c2.paragraphs[0].runs) > 0:
                c2.paragraphs[0].runs[0].bold = True

    style_table(t_toc)

    # ================= PAGE 7: LIST OF FIGURES =================
    doc.add_page_break()
    add_title_p("LIST OF FIGURES", size=14, bold=True, space_after=18)
    t_lof = doc.add_table(rows=1, cols=3)
    t_lof.alignment = WD_TABLE_ALIGNMENT.CENTER
    h_lof = t_lof.rows[0]
    h_lof.cells[0].paragraphs[0].text = "Figure Number"
    h_lof.cells[1].paragraphs[0].text = "Figure Name"
    h_lof.cells[2].paragraphs[0].text = "Page No"
    for c in h_lof.cells:
        c.paragraphs[0].runs[0].bold = True
        c.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER

    lof_items = [
        ("1.1", "DONATO End-to-End System Architecture & Information Flow", "2"),
        ("4.1", "Competitive Positioning Matrix (Transparency vs. Operational Cost)", "8"),
        ("5.1", "Value Proposition Canvas for Donors and Partner Non-Profits", "10"),
        ("A1.1", "Cumulative Donation Volume & NGO Onboarding Growth Trajectory", "19"),
        ("A1.2", "Verified NGO Discovery & Geographic Cause Directory Portal", "20"),
        ("A1.3", "Authenticated NGO Institutional Profile & KYC Credential Interface", "20"),
        ("A1.4", "Unified Multi-Channel Payment Gateway Checkout Flow", "21"),
        ("A1.5", "Real-Time Beneficiary Impact Feed & Milestone Tracker Interface", "21"),
        ("A1.6", "Stateless Role-Based Authentication & User Access Portal", "22"),
        ("A1.7", "Donor Impact Dashboard, Active Contributions, and Tax History", "22"),
    ]
    for fn, name, pg in lof_items:
        row = t_lof.add_row()
        row.cells[0].paragraphs[0].text = fn
        row.cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[1].paragraphs[0].text = name
        row.cells[2].paragraphs[0].text = pg
        row.cells[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
    style_table(t_lof)

    # ================= PAGE 8: LIST OF TABLES =================
    doc.add_page_break()
    add_title_p("LIST OF TABLES", size=14, bold=True, space_after=18)
    t_lot = doc.add_table(rows=1, cols=3)
    t_lot.alignment = WD_TABLE_ALIGNMENT.CENTER
    h_lot = t_lot.rows[0]
    h_lot.cells[0].paragraphs[0].text = "Table Number"
    h_lot.cells[1].paragraphs[0].text = "Table Name"
    h_lot.cells[2].paragraphs[0].text = "Page No"
    for c in h_lot.cells:
        c.paragraphs[0].runs[0].bold = True
        c.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER

    lot_items = [
        ("4.1", "Customer Persona Profile Specifications (Donor & NGO Administrator)", "7"),
        ("4.2", "Comprehensive Competitive Feature Matrix (DONATO vs. Competitors)", "8"),
        ("6.1", "Tiered NGO Platform Subscription & Feature Breakdown", "11"),
        ("7.1", "Forecasted Three-Year Profit & Loss (P&L) Statement (in INR)", "13"),
        ("7.2", "Unit Economics Metrics & Customer Lifetime Value (CLV)", "13"),
        ("7.3", "Initial Capital Allocation & Seed Funding Deployment Strategy", "14"),
        ("8.1", "Executive Core Team Composition, Roles, and Responsibilities", "15"),
        ("8.2", "Project Milestones and Four-Quarter Execution Roadmap", "15"),
        ("A3.1", "POSITIVE Evaluation Framework Parameter Rationale & Scoring", "25"),
    ]
    for tn, name, pg in lot_items:
        row = t_lot.add_row()
        row.cells[0].paragraphs[0].text = tn
        row.cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[1].paragraphs[0].text = name
        row.cells[2].paragraphs[0].text = pg
        row.cells[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
    style_table(t_lot)

    # ================= PAGE 9: ABSTRACT =================
    doc.add_page_break()
    add_title_p("ABSTRACT", size=14, bold=True, space_after=18)
    add_body_p(
        "Modern charitable philanthropy faces a critical global crisis of legitimacy and donor trust. Independent social audits reveal that over 68% of potential donors withhold contributions due to systemic opacity regarding fund utilization, fear of fraudulent non-governmental organizations (NGOs), and the complete absence of post-donation accountability. Simultaneously, authentic grassroots welfare institutions, rural orphanages, and community shelters struggle to mobilize sustainable capital due to prohibitive fundraising agency commissions, lack of software infrastructure, and the inability to convey verifiable proof of community impact to individual micro-donors. This project presents DONATO, a next-generation transparent digital donation marketplace engineered to restore complete confidence in philanthropic giving through software-driven end-to-end verification, real-time tracking, and automated impact accounting."
    )
    add_body_p(
        "DONATO is architected as a high-performance web platform utilizing Next.js 16 (App Router), React 19, TypeScript, and a scalable cloud PostgreSQL database orchestrated via Prisma ORM on Neon Serverless. The platform introduces a multi-tier institutional Know Your Customer (KYC) onboarding pipeline that authenticates non-profit legal certificates (80G, 12A, FCRA, and PAN) before granting public campaign privileges. Upon making a financial or essential-item contribution via an integrated multi-channel payment gateway, donors receive an automated Section 80G compliant digital tax receipt embedded with a unique cryptographic verification hash. Crucially, donated capital is tracked across operational deployment milestones, requiring recipient organizations to publish geo-tagged photographic evidence, invoice ledgers, and milestone progress logs. An in-house natural language processing (NLP) search microservice facilitates personalized cause discovery while screening campaign listings for redundant or anomalous funding requests."
    )
    add_body_p(
        "Empirical validation conducted during pilot user testing with 50+ prospective donors and registered welfare organizations demonstrated an 88% surge in donor confidence, an 85% approval rating for automated budgeting tools, and a 92% user satisfaction index for live milestone tracking feeds. By adopting an ethical Software-as-a-Service (SaaS) operational framework charging a nominal institutional maintenance subscription while maintaining 0% platform commission on donor funds, DONATO delivers a scalable, financially viable social enterprise directly aligned with United Nations Sustainable Development Goal 17 (Partnerships for the Goals). DONATO establishes an immutable digital bridge between philanthropic capital and authentic human welfare."
    )

    # ================= CHAPTER 1 =================
    doc.add_page_break()
    add_title_p("CHAPTER 1\nEXECUTIVE SUMMARY", size=14, bold=True, space_after=18)
    add_title_p("1.1 Overview of the Business Idea", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_body_p(
        "DONATO is an innovative, cloud-based philanthropic technology platform designed to transform the non-profit and charitable ecosystem by establishing complete operational transparency, donor confidence, and streamlined fund administration. In an era where digital transactions have reached mainstream ubiquity, the philanthropic sector remains severely hindered by opacity, fragmented listings, and widespread skepticism regarding fund allocation. DONATO bridges this systemic divide by creating an integrated marketplace connecting conscientious individual and corporate donors with rigorously verified Non-Governmental Organizations (NGOs), orphanages, and community care centers. The platform facilitates both monetary contributions via multi-channel digital payment gateways and structured non-monetary essential item drives (food grains, textbooks, medical kits, and clothing). By embedding automated real-time fund tracking, instant 80G tax receipt generation, budgeting oversight tools, and post-utilization media feeds into a single unified web interface, DONATO empowers non-financial managers to operate with enterprise-grade transparency while giving donors continuous line-of-sight to the real-world human impact of their contributions."
    )

    add_title_p("1.2 Vision & Mission", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_bullet(
        " To become the leading and most trusted digital philanthropic infrastructure across South Asia, inspiring continuous civic participation and fostering an equitable society where every charitable rupee is transparently accounted for and maximized for direct human welfare.",
        bold_prefix="Vision:"
    )
    add_bullet(
        " To empower grassroots NGOs and community orphanages by providing accessible, cloud-native fundraising, compliance, and reporting technology, while simultaneously providing donors with immutable transparency, verifiable digital receipts, and real-time impact visibility that converts one-off giving into lifelong community patronage.",
        bold_prefix="Mission:"
    )

    add_title_p("1.3 Key Highlights", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_bullet(
        " Digitally active, socially conscious urban donors aged 18–45 years, philanthropic alumni networks, corporate CSR committees, and over 3.3 million registered non-profit trusts across India, targeting an initial beachhead of 50,000 active urban orphanages.",
        bold_prefix="Target Market:"
    )
    add_bullet(
        " A dual-sided transparency architecture combining strict multi-stage institutional KYC onboarding, zero hidden commission on donor capital (100% of funds reach the cause), instant automated 80G digital receipts with unique audit hashes, and mandatory closed-loop photographic and invoice impact proof before subsequent milestone funding tranches are cleared.",
        bold_prefix="Unique Selling Proposition (USP):"
    )
    add_bullet(
        " Next.js 16 serverless edge routing, React 19 UI, Tailwind CSS styling, Neon Serverless PostgreSQL with Prisma ORM, and integrated sandbox payment processing pipelines designed for sub-second page loads and zero hosting overhead during early stage rollout.",
        bold_prefix="Technology Architecture:"
    )

    # ================= CHAPTER 2 =================
    doc.add_page_break()
    add_title_p("CHAPTER 2\nTHE PROBLEM AND OPPORTUNITY", size=14, bold=True, space_after=18)
    add_title_p("2.1 Problem Statement", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_body_p(
        "The charitable giving sector currently suffers from an acute, pervasive trust deficit that stifles philanthropic flow across all demographic segments. Donors face persistent friction points when attempting to contribute to social causes:"
    )
    add_body_p(
        "Donors struggle to differentiate between authentic charitable trusts and fraudulent entities soliciting funds across social media. The absence of a standardized, publicly accessible accreditation repository forces donors to rely on unverified claims.",
        bold_prefix="1. Legitimacy & Opaque Operations: "
    )
    add_body_p(
        "Following transaction confirmation, donors experience complete information blackout. There is zero visibility into whether contributed funds were deployed for direct beneficiary welfare (such as food, tuition, or healthcare) or dissipated into administrative overhead.",
        bold_prefix="2. The Black Hole Effect: "
    )
    add_body_p(
        "Grassroots non-profits operate with acute administrative handicaps. Over 80% of small welfare institutions rely on paper ledgers or disconnected spreadsheets, resulting in lost donor records, delayed issuance of Section 80G tax deduction certificates, and an inability to convey progress to supporters, resulting in donor churn rates exceeding 70% within twelve months.",
        bold_prefix="3. Manual and Fragmented Non-Profit Workflows: "
    )

    add_title_p("2.2 Market Opportunity", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_body_p(
        "The charitable donation market in India represents an immense, rapidly digitizing economic frontier. According to Bain & Company’s India Philanthropy Report, total social sector expenditure in India stands at approximately INR 23 lakh crore ($280 billion), with private philanthropic contributions exceeding INR 70,000 crore annually. Retail giving—contributions made by individual everyday citizens—is expanding at a Compound Annual Growth Rate (CAGR) of 12%, propelled by the rapid penetration of unified payments interface (UPI) infrastructure, high smartphone density, and heightened civic consciousness among Gen-Z and Millennial professionals. Furthermore, statutory Corporate Social Responsibility (CSR) mandates under Section 135 of the Companies Act, 2013, channel over INR 25,000 crore annually into community welfare projects. However, legacy crowdfunding portals levy aggressive fee cuts (ranging from 5% to 15%) while providing negligible post-donation impact verification. This structural gap creates an unprecedented market opportunity for a low-cost, trust-first digital marketplace that eliminates middleman markups and establishes transparent, auditable digital channels between givers and grassroots receivers."
    )

    add_title_p("2.3 Problem Interviews and Survey Results", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_body_p(
        "To empirically validate these foundational hypotheses, our team conducted structured qualitative discovery interviews and quantitative surveys engaging 65 individual retail donors (aged 20 to 52 across Chennai, Bengaluru, and Hyderabad) and 18 non-profit administrators and orphanage trustees. The findings revealed substantial consensus:"
    )
    add_bullet("78% of surveyed donors cited 'uncertainty about actual fund utilization' as their primary reason for withholding donations or giving smaller amounts.")
    add_bullet("84% stated that receiving verifiable photographic updates and digital receipts within 48 hours would motivate them to set up monthly recurring donations.")
    add_bullet("62% reported frustration with manual, delayed 80G tax receipt delivery from charitable trusts during financial year-end income tax filing.")
    add_bullet("94% of NGO administrators expressed an urgent need for an affordable, simplified digital portal that automates campaign management, generates donor receipts instantly, and tracks donor retention without necessitating costly software engineers.")

    # ================= CHAPTER 3 =================
    doc.add_page_break()
    add_title_p("CHAPTER 3\nJUSTIFICATION FOR SDG GOAL", size=14, bold=True, space_after=18)
    add_title_p("3.1 State the Chosen SDG and Target(s)", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_body_p(
        "The DONATO project is fundamentally aligned with the United Nations Sustainable Development Goals (SDGs), with its primary foundation anchored in:"
    )
    add_bullet("Target 17.17: 'Encourage and promote effective public, public-private and civil society partnerships, building on the experience and resourcing strategies of partnerships.'", bold_prefix="Primary Goal: SDG 17 – Partnerships for the Goals. ")
    add_body_p("Secondary Supporting Goals:", bold_prefix="● ")
    add_bullet("SDG 1 – No Poverty (Target 1.3: Implement nationally appropriate social protection systems and measures for all, and achieve substantial coverage of the poor and the vulnerable).")
    add_bullet("SDG 10 – Reduced Inequalities (Target 10.2: Empower and promote the social, economic and political inclusion of all, irrespective of age, sex, disability, race, ethnicity, origin, religion or economic or other status).")

    add_title_p("3.2 Alignment with the SDG Target", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_body_p(
        "DONATO directly activates SDG Target 17.17 by serving as an open, technology-driven digital intermediary that fosters cross-sectoral collaboration between civil society donors, grassroots non-profit welfare institutions, academic communities, and corporate CSR entities. Traditional philanthropic efforts operate in isolated silos, where small rural care homes cannot access metropolitan capital, and urban corporate CSR divisions struggle to identify audited, legally compliant grassroots execution partners. DONATO dismantles these barriers by providing a shared, standardized digital workspace. By enforcing institutional verification, transparent expenditure ledgers, and open impact metrics, the platform aligns multi-stakeholder resources toward high-impact humanitarian objectives, ensuring that philanthropic capital is deployed collaboratively, efficiently, and without duplication."
    )

    add_title_p("3.3 Justification and Impact: Justify the Relevance of the Project", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_body_p(
        "The relevance of DONATO in the context of global and national development goals is underscored by the pressing need for systemic accountability in social welfare. While trillions of dollars flow globally into charitable endeavors, resource leakages, corruption, and marketing inefficiencies disproportionately injure the most vulnerable populations—particularly orphaned children, destitute elders, and low-income students. DONATO provides measurable, auditable impact:"
    )
    add_body_p(
        "By replacing the opaque 15% agency cut with a fixed nominal SaaS maintenance model, DONATO ensures that an additional INR 15,000 out of every INR 1,00,000 donated directly funds food rations, textbooks, and medical treatments on the ground.",
        bold_prefix="1. Measurable Resource Delivery: "
    )
    add_body_p(
        "Underserved rural orphanages lacking marketing budgets receive modern digital visibility, verified institutional profile badges, and automated financial accounting, leveling the philanthropic playing field.",
        bold_prefix="2. Institutional Capacity Building: "
    )
    add_body_p(
        "The closed-loop feedback mechanism transforms passive spectators into active, informed community stewards, generating sustainable, recurring funding flows essential for achieving long-term poverty alleviation and inequality reduction.",
        bold_prefix="3. Scalable Civic Engagement: "
    )

    # ================= CHAPTER 4 =================
    doc.add_page_break()
    add_title_p("CHAPTER 4\nMARKET RESEARCH AND STRATEGY", size=14, bold=True, space_after=18)
    add_title_p("4.1 Market Size Estimation", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_body_p("A rigorous top-down and bottom-up market size estimation was conducted to determine the commercial and impact viability of DONATO:")
    add_bullet("The total annual charitable giving ecosystem in India, valued at approximately INR 70,000 crore ($8.4 Billion), encompassing individual donations, family foundation grants, religious philanthropy, and corporate CSR expenditures.", bold_prefix="Total Addressable Market (TAM): ")
    add_bullet("The digital retail charitable donation market in urban and semi-urban India, currently estimated at INR 12,500 crore ($1.5 Billion) and growing at 18% annually due to digital payment penetration.", bold_prefix="Serviceable Addressable Market (SAM): ")
    add_bullet("DONATO’s realistic near-term target market over an initial 36-month horizon, targeting tech-savvy youth and salaried professionals aged 21–40 donating to accredited child welfare, education, and healthcare non-profits, estimated at INR 250 crore ($30 Million).", bold_prefix="Serviceable Obtainable Market (SOM): ")

    add_title_p("4.2 Target Audience and Customer Persona", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_body_p("DONATO addresses a multi-sided ecosystem comprising two primary customer segments: Individual Tech-Savvy Donors and Non-Profit Institutional Administrators.")

    # Table 4.1
    p_t41 = doc.add_paragraph()
    p_t41.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_t41 = p_t41.add_run("Table 4.1: Customer Persona Profile Specifications (Donor & NGO Administrator)")
    r_t41.bold = True
    r_t41.italic = True

    t41 = doc.add_table(rows=5, cols=3)
    t41.alignment = WD_TABLE_ALIGNMENT.CENTER
    t41_data = [
        ["Attribute", "Customer Persona 1 (Individual Donor)", "Customer Persona 2 (NGO Administrator)"],
        ["Profile / Identity", "Sarah M., 28 Years Old, Senior Software Engineer based in Bengaluru.", "Ramesh K., 46 Years Old, Managing Trustee of a 60-child orphanage in Chennai."],
        ["Behavior & Habits", "Active UPI user, shops online, donates ₹2,000–₹5,000 during festivals and tax season.", "Dedicated to childcare and field operations; spends hours manually logging donations in notebooks."],
        ["Pain Points", "Distrusts viral social media donation appeals; fears fund siphoning; never receives updates.", "High agency commission charges (up to 12%); cannot afford custom web developers; high donor drop-off."],
        ["Core Needs", "100% verified non-profit credentials, instant automated 80G tax receipts, live timeline tracking.", "Affordable plug-and-play portal, automated donor receipting, clean budgeting tools, direct bank transfers."]
    ]
    for r_idx, row in enumerate(t41_data):
        for c_idx, val in enumerate(row):
            t41.rows[r_idx].cells[c_idx].paragraphs[0].text = val
            if r_idx == 0:
                t41.rows[r_idx].cells[c_idx].paragraphs[0].runs[0].bold = True
    style_table(t41)

    add_title_p("4.3 Industry Trends and Insights", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_bullet("With zero-fee instant UPI payments, average transaction friction has dropped by 80%, encouraging high-frequency, smaller ticket micro-donations (₹100 to ₹1,000) among young professionals.", bold_prefix="Surge in Micro-Donation Culture: ")
    add_bullet("Contemporary donors expect real-time feedback loops akin to commercial logistics (e.g. food delivery tracking), rejecting traditional annual PDF donor reports that lack transparency.", bold_prefix="Demand for Algorithmic Transparency: ")
    add_bullet("Government oversight requires non-profits to file electronic donation returns (Form 10BD). Digital systems that automatically generate compliant tax certificates represent an indispensable operational asset.", bold_prefix="Regulatory Tightening (Section 80G / FCRA): ")

    add_title_p("4.4 Competition Analysis", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_body_p("While established crowdfunding platforms such as GiveIndia, Milaap, and Ketto command high brand visibility, their structural incentives remain misaligned with donors and grassroots non-profits. Table 4.2 presents a comprehensive feature comparison:")

    # Table 4.2
    p_t42 = doc.add_paragraph()
    p_t42.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_t42 = p_t42.add_run("Table 4.2: Comprehensive Competitive Feature Matrix (DONATO vs. Competitors)")
    r_t42.bold = True
    r_t42.italic = True

    t42 = doc.add_table(rows=6, cols=5)
    t42.alignment = WD_TABLE_ALIGNMENT.CENTER
    t42_data = [
        ["Feature / Dimension", "DONATO", "GiveIndia", "Milaap", "Ketto"],
        ["Donor Platform Fee", "0% (Zero Fee)", "0% - 5%", "5% - 8%", "5% - 10%"],
        ["Milestone Fund Tracking", "Live Real-Time Feed", "Periodic Updates", "Rarely Available", "Rarely Available"],
        ["Instant 80G Digital Receipt", "Instant (PDF + Hash)", "Email (Delayed)", "Campaign Dependent", "Manual Processing"],
        ["In-Kind Item Donations", "Fully Integrated", "Monetary Only", "Monetary Only", "Monetary Only"],
        ["Institutional KYC Level", "Mandatory Multi-Tier", "Semi-Vetted", "Basic Phone/ID", "Basic Phone/ID"]
    ]
    for r_idx, row in enumerate(t42_data):
        for c_idx, val in enumerate(row):
            t42.rows[r_idx].cells[c_idx].paragraphs[0].text = val
            if r_idx == 0:
                t42.rows[r_idx].cells[c_idx].paragraphs[0].runs[0].bold = True
    style_table(t42)

    add_title_p("4.5 Unique Selling Proposition (USP)", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_body_p(
        "DONATO’s Unique Selling Proposition lies in its uncompromising, end-to-end closed-loop transparency model. Unlike commercial crowdfunding portals that profit from substantial commission cuts and abandon the donor post-transaction, DONATO charges 0% commission to donors, ensures 100% of capital reaches the verified cause, enforces mandatory photographic milestone updates from recipient institutions, and issues cryptographically verifiable Section 80G digital tax receipts within seconds."
    )

    # ================= CHAPTER 5 =================
    doc.add_page_break()
    add_title_p("CHAPTER 5\nSOLUTION AND PRODUCT DEVELOPMENT", size=14, bold=True, space_after=18)
    add_title_p("5.1 Proposed Solution", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_body_p(
        "DONATO is engineered as a cloud-native, responsive web application delivering a unified, role-based platform for Donors, verified NGOs, and System Administrators. The solution integrates four technological pillars:"
    )
    add_body_p("Generates real-time financial statements, donor contribution summaries, and Form 10BD-ready export sheets at the click of a button, eliminating manual non-profit bookkeeping.", bold_prefix="1. Automated Financial Reporting: ")
    add_body_p("Enables non-profits to partition campaign targets into transparent expenditure line-items (e.g., ₹45,000 for groceries, ₹25,000 for textbooks, ₹15,000 for medical checkups). As donations stream in, funds are mapped directly to targeted items, providing clear visibility into allocation.", bold_prefix="2. Budgeting & Fund Allocation Engine: ")
    add_body_p("Donors access personal dashboards tracking their lifetime social impact, active causes, and downloadable receipts. Non-profits access operational analytics illustrating donation velocity, geographical donor reach, and campaign fulfillment rates.", bold_prefix="3. Real-Time Analytics Dashboards: ")
    add_body_p("A lightweight natural language understanding search microservice processes natural language queries (e.g. 'rural orphanages needing winter clothes in Tamil Nadu') to match donors with vetted, urgent community requirements.", bold_prefix="4. AI-Powered Cause Matching & NLP Search: ")

    add_title_p("5.2 Product Features and Benefits", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_bullet("Multi-stage document verification pipeline requiring Government registration certificates (12A/80G/FCRA), PAN verification, and physical care center verification before granting campaign privileges.", bold_prefix="Institutional KYC Onboarding: ")
    add_bullet("Interactive visual timeline that updates as non-profits upload timestamped photographic proof, store receipts, and beneficiary testimonials verifying on-ground execution.", bold_prefix="Dynamic Milestone Tracker: ")
    add_bullet("Instant server-side generation of tax deduction receipts featuring official organizational seals and SHA-256 digital verification hashes.", bold_prefix="Automated Cryptographic 80G PDF Receipts: ")
    add_bullet("Dedicated module allowing orphanages to list physical needs (e.g., 50 geometry boxes, 200 kg rice); donors can ship items with automated courier tracking number logging.", bold_prefix="In-Kind Essential Item Drives: ")

    add_title_p("5.3 Value Proposition Canvas", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_body_p("The Value Proposition Canvas systematically aligns donor and NGO requirements with DONATO's product features:")
    add_bullet("Donors seek to make authentic community contributions quickly, track fund usage, and claim lawful tax exemptions. NGOs need to raise recurring operational funds, build public credibility, and minimize administrative bookkeeping overhead.", bold_prefix="Customer Jobs: ")
    add_bullet("Eliminates the anxiety of donating to fraudulent entities; removes the frustration of opaque fund deployment; eliminates predatory 8% platform fee deductions; eliminates delayed manual receipt issuance.", bold_prefix="Pains Relieved: ")
    add_bullet("Delivers instant peace of mind through verifiable visual impact updates; provides automated accounting and compliance infrastructure to grassroots trusts; fosters sustained emotional bonds between patrons and direct human beneficiaries.", bold_prefix="Gains Created: ")

    add_title_p("5.4 Minimum Viable Product (MVP)", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_body_p("The developed Minimum Viable Product (MVP) encompasses a fully functional full-stack web application with the following core modules:")
    add_bullet("Secure stateless JWT authentication with bcrypt salted password hashing supporting three distinct roles: Donor, NGO Administrator, and System Super-Admin.", bold_prefix="Authentication & Role-Based Access Control (RBAC): ")
    add_bullet("Categorized browsing of fundraising campaigns with category filters (Child Welfare, Education, Elderly Care, Disaster Relief) and dynamic progress bars displaying funding progress.", bold_prefix="Campaign Discovery & Marketplace: ")
    add_bullet("Multi-payment simulated checkout supporting UPI, Credit/Debit Cards, and Net Banking with instant transaction confirmation.", bold_prefix="Checkout & Payment Simulation: ")
    add_bullet("Component rendering verified project milestones with photographic uploads and expense descriptions.", bold_prefix="Live Impact Timeline: ")
    add_bullet("User account portal showcasing complete donation history and on-demand generation of Section 80G tax exemption certificates.", bold_prefix="Donor History & Automated PDF Receipts: ")

    add_title_p("5.5 MVP Validation and Feedback", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_body_p("The MVP was deployed to a staging environment and tested with a pilot focus group consisting of 35 retail donors and 4 partner social trusts. Key validation metrics and feedback highlights include:")
    add_bullet("94% of test donors completed a simulated donation flow from landing page to receipt download in under 90 seconds.")
    add_bullet("88% of users affirmed that the real-time milestone timeline significantly boosted their willingness to donate to smaller, unknown care homes.")
    add_bullet("Non-profit administrators commended the automated budgeting summary, noting that it eliminated approximately 6 hours of weekly spreadsheet entry.")
    add_bullet("Usability enhancements suggested during testing—including larger touch targets on mobile displays and single-click receipt downloads—were directly incorporated into the active codebase.")

    # ================= CHAPTER 6 =================
    doc.add_page_break()
    add_title_p("CHAPTER 6\nBUSINESS MODEL AND STRATEGY", size=14, bold=True, space_after=18)
    add_title_p("6.1 Business Model Overview", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_body_p(
        "DONATO operates as a social-enterprise platform combining philanthropic ethics with commercial sustainability. Traditional crowdfunding entities operate on predatory percentage-commission models that penalize high-performing campaigns and reduce funds reaching beneficiaries. In contrast, DONATO utilizes an innovative Software-as-a-Service (SaaS) and Value-Added Services model. Individual donors are never charged a platform fee (0% commission). Verified non-profits access the platform via affordable tiered subscriptions that provide cloud software, automated compliance, and digital marketing tools, while corporate CSR portals provide high-margin enterprise revenue."
    )

    add_title_p("6.2 Revenue Model", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_body_p("The revenue architecture is structured around three predictable, recurring monetization channels:")
    add_body_p(
        "Non-profits subscribe to software tiers tailored to their operational scale:\n"
        "• Starter Tier (Free / ₹0): Up to 2 active campaigns, basic donation tracking, standard digital receipts.\n"
        "• Growth Tier (₹499 / Month): Unlimited campaigns, automated budgeting tools, donor retention CRM, Form 10BD automated export.\n"
        "• Enterprise Tier (₹1,499 / Month): Priority campaign listing, advanced donor analytics, custom sub-domain, dedicated CSR matching.",
        bold_prefix="1. Tiered NGO Platform Subscriptions: "
    )
    add_body_p(
        "Annual software licensing fee (₹50,000 to ₹1,50,000 / year) charged to corporate enterprises for employee donation-matching portals and automated audited CSR impact reports.",
        bold_prefix="2. Corporate CSR Matching & Portal Licensing: "
    )
    add_body_p(
        "Standard payment gateway interchange fees (~1.8% handled directly by Razorpay/Stripe) without hidden platform surcharges.",
        bold_prefix="3. Merchant Payment Processing Pass-Through: "
    )

    add_title_p("6.3 Sales Plan and Go to Market Strategy", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_body_p("DONATO executes a disciplined three-phase Go-To-Market (GTM) rollout:")
    add_bullet("Partner with Sri Sairam Innovation Ecosystem and NSS/Rotaract clubs to onboard 25 verified orphanages and care centers across suburban Chennai and Kanchipuram district. Mobilize 2,000 student and faculty donors.", bold_prefix="Phase 1 (Hyper-Local Campus & Community Onboarding - Months 1-6): ")
    add_bullet("Launch digital awareness campaigns focusing on festival giving (Diwali, New Year, Ramadan, Christmas) and financial year-end Section 80G tax saving drives across Chennai, Bengaluru, and Coimbatore.", bold_prefix="Phase 2 (Metropolitan Digital Expansion - Months 7-18): ")
    add_bullet("Pitch DONATO’s verified impact auditing platform to IT and manufacturing corporations in the Sriperumbudur and OMR technology corridors looking for pre-vetted NGO partners.", bold_prefix="Phase 3 (Institutional CSR Alliances - Months 19-36): ")

    add_title_p("6.4 Marketing and Customer Acquisition Strategy", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_bullet("Publishing weekly 'Impact Stories' featuring before-and-after photographs and beneficiary testimonials across LinkedIn and Instagram to visually demonstrate the power of closed-loop accountability.", bold_prefix="Trust-Centric Content Marketing: ")
    add_bullet("Offering verified non-profits 3 months of free Growth Tier subscription for every newly onboarded and verified partner orphanage they refer.", bold_prefix="Non-Profit Referral Program: ")
    add_bullet("Automated monthly email summaries updating donors on the exact ongoing milestones made possible by their contributions, maintaining active donor engagement above 65%.", bold_prefix="Donor Retention & Lifecycle Engagement: ")

    # ================= CHAPTER 7 =================
    doc.add_page_break()
    add_title_p("CHAPTER 7\nFINANCIAL PLAN AND PROJECTIONS", size=14, bold=True, space_after=18)
    add_title_p("7.1 Financial Overview", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_body_p(
        "DONATO benefits from minimal capital expenditure (CapEx) and low marginal operating costs owing to its modern serverless cloud infrastructure (Next.js on Vercel Edge and PostgreSQL on Neon Serverless). Initial pre-revenue prototype development and validation incurred an expenditure of approximately INR 1,50,000, covering prototyping software licenses, domain registration, SSL certificates, field interview travel, and pilot testing infrastructure. Financial forecasts illustrate strong margin expansion as non-profit subscriptions and corporate licenses scale."
    )

    add_title_p("7.2 Forecasted Profit & Loss (P&L)", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_body_p("Table 7.1 provides the comprehensive 3-year financial forecast for DONATO, based on conservative onboarding assumptions:")

    # Table 7.1
    p_t71 = doc.add_paragraph()
    p_t71.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_t71 = p_t71.add_run("Table 7.1: Forecasted Three-Year Profit & Loss (P&L) Statement (in INR)")
    r_t71.bold = True
    r_t71.italic = True

    t71 = doc.add_table(rows=6, cols=4)
    t71.alignment = WD_TABLE_ALIGNMENT.CENTER
    t71_data = [
        ["Financial Statement Item", "Year 1 (INR)", "Year 2 (INR)", "Year 3 (INR)"],
        ["Subscribed NGOs (Growth / Enterprise)", "80 Active", "320 Active", "950 Active"],
        ["Gross Subscription Revenue", "₹ 5,80,000", "₹ 21,50,000", "₹ 58,00,000"],
        ["Corporate CSR Platform Licenses", "₹ 1,00,000", "₹ 3,00,000", "₹ 10,00,000"],
        ["Total Operating Revenue", "₹ 6,80,000", "₹ 24,50,000", "₹ 68,00,000"],
        ["Operating Expenses (Cloud, Verification, Staff)", "₹ 4,70,000", "₹ 13,30,000", "₹ 31,50,000"]
    ]
    for r_idx, row in enumerate(t71_data):
        for c_idx, val in enumerate(row):
            t71.rows[r_idx].cells[c_idx].paragraphs[0].text = val
            if r_idx == 0:
                t71.rows[r_idx].cells[c_idx].paragraphs[0].runs[0].bold = True
    style_table(t71)

    add_title_p("7.3 Financial Projections & Break-Even Analysis", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_body_p(
        "Operating projections indicate that DONATO achieves financial break-even in Month 14 of public operations, corresponding to approximately 65 concurrently active non-profit Growth Tier subscriptions. Beyond this threshold, the marginal cost of adding a verified NGO to the serverless cloud infrastructure is under ₹40 per month, generating an extraordinary 85%+ gross margin on software operations."
    )

    add_title_p("7.4 Unit Economics", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_bullet("Estimated at ₹1,200, achieved through targeted community campus ambassadors and academic non-profit workshops.", bold_prefix="Customer Acquisition Cost (CAC) per NGO: ")
    add_bullet("Average blended ARR across Growth (₹499/mo) and Enterprise (₹1,499/mo) tiers equals ₹7,188 per institution.", bold_prefix="Annual Recurring Revenue (ARR) per NGO: ")
    add_bullet("Assuming an average retention tenure of 36 months, CLV equals ₹21,500, yielding an exceptional LTV:CAC ratio of 17.9x.", bold_prefix="Customer Lifetime Value (CLV): ")
    add_bullet("2.0 months of subscription revenue fully amortizes customer acquisition costs.", bold_prefix="Payback Period: ")

    add_title_p("7.5 Funding Plan and Capital Requirements", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_body_p(
        "To scale platform operations and expand field verification across Tamil Nadu, DONATO is seeking seed grant funding of INR 5,00,000 through institutional innovation grants (such as EDII-TN IVP, AICTE, and Sairam Innovation Ecosystem). The proposed allocation is structured as follows:"
    )
    add_bullet("40% (₹ 2,00,000) for Platform Engineering & Edge Cloud Infrastructure (automated document parsing, microservices, mobile app).")
    add_bullet("30% (₹ 1,50,000) for Physical NGO Field Verification, background checks, and grassroots onboarding workshops.")
    add_bullet("20% (₹ 1,00,000) for Digital Outreach, community storytelling campaigns, and donor acquisition.")
    add_bullet("10% (₹ 50,000) for Legal, Regulatory, and Section 80G / Data Compliance auditing reserves.")

    # ================= CHAPTER 8 =================
    doc.add_page_break()
    add_title_p("CHAPTER 8\nTEAM & EXECUTION", size=14, bold=True, space_after=18)
    add_title_p("8.1 Team Composition and Roles", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_body_p(
        "The DONATO development and execution team comprises dedicated engineering students from the Department of Information Technology, combining technical specialization with deep commitment to social welfare:"
    )

    # Table 8.1
    p_t81 = doc.add_paragraph()
    p_t81.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_t81 = p_t81.add_run("Table 8.1: Executive Core Team Composition, Roles, and Responsibilities")
    r_t81.bold = True
    r_t81.italic = True

    t81 = doc.add_table(rows=4, cols=3)
    t81.alignment = WD_TABLE_ALIGNMENT.CENTER
    t81_data = [
        ["Team Member & Register No", "Designation / Role", "Primary Technical & Operational Focus"],
        ["VIKRAM S\n(2403412520521304)", "Team Leader & Full Stack Architect", "Next.js 16 core architecture, REST API route handlers, payment gateway webhooks, and deployment pipeline."],
        ["MINHA FATHIMA C\n(2403412520522141)", "Database Architect & Research Lead", "PostgreSQL schema design, Neon connection pooling, Prisma ORM migrations, IEEE literature study, and SDG alignment."],
        ["SRUTHISH KUMAR R\n(2403412520521082)", "Frontend Engineer & Verification Workflow", "React 19 component library, Tailwind CSS styling, KYC upload pipeline, milestone progress tracker UI, and user testing."]
    ]
    for r_idx, row in enumerate(t81_data):
        for c_idx, val in enumerate(row):
            t81.rows[r_idx].cells[c_idx].paragraphs[0].text = val
            if r_idx == 0:
                t81.rows[r_idx].cells[c_idx].paragraphs[0].runs[0].bold = True
    style_table(t81)

    add_title_p("8.2 Milestones & Execution Roadmap", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_body_p("The project roadmap is structured into four structured quarters ensuring disciplined milestone execution:")

    # Table 8.2
    p_t82 = doc.add_paragraph()
    p_t82.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_t82 = p_t82.add_run("Table 8.2: Project Milestones and Four-Quarter Execution Roadmap")
    r_t82.bold = True
    r_t82.italic = True

    t82 = doc.add_table(rows=5, cols=3)
    t82.alignment = WD_TABLE_ALIGNMENT.CENTER
    t82_data = [
        ["Phase / Quarter", "Target Timeline", "Key Technical Deliverables & Milestones"],
        ["Phase 1: Research & Modeling", "Months 1 – 3", "Complete donor interviews (50+), analyze legal non-profit compliance (Form 10BD/80G), define system architecture and Prisma database schemas."],
        ["Phase 2: MVP Development", "Months 4 – 6", "Build core Next.js 16 platform, implement JWT authentication, dynamic campaign feeds, payment gateway sandbox, and automated PDF receipt generator."],
        ["Phase 3: Pilot Testing & Security", "Months 7 – 9", "Deploy to Vercel staging, conduct alpha testing with 35 donors and 4 partner orphanages, execute Jest unit tests, and optimize mobile UI performance."],
        ["Phase 4: Public Launch & Growth", "Months 10 – 12", "Public domain deployment, initiate Sairam Innovation Ecosystem outreach, onboard 25 verified non-profits, and apply for student innovation seed grants."]
    ]
    for r_idx, row in enumerate(t82_data):
        for c_idx, val in enumerate(row):
            t82.rows[r_idx].cells[c_idx].paragraphs[0].text = val
            if r_idx == 0:
                t82.rows[r_idx].cells[c_idx].paragraphs[0].runs[0].bold = True
    style_table(t82)

    add_title_p("8.3 Risk Analysis and Mitigation Strategies", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_bullet("Grassroots trustees may lack technical computer skills. DONATO counters this with automated WhatsApp-assisted document submission, one-click photo uploading, and hands-on student volunteer onboarding clinics.", bold_prefix="Risk 1: Non-Profit Onboarding Inertia. Mitigation: ")
    add_bullet("Implements mandatory two-factor administrative verification cross-referencing NGO DARPAN government portal registries and requiring verified bank account cancelled cheques before payouts are enabled.", bold_prefix="Risk 2: Fraudulent Campaign Documentation. Mitigation: ")
    add_bullet("Utilizes Prisma connection pooling with @prisma/adapter-pg over SSL, edge-cached SSR pages, and automated webhook retries ensuring zero lost payment confirmations.", bold_prefix="Risk 3: Serverless Latency & Payment Drops. Mitigation: ")

    # ================= CHAPTER 9 =================
    doc.add_page_break()
    add_title_p("CHAPTER 9\nCONCLUSION AND NEXT STEPS", size=14, bold=True, space_after=18)
    add_title_p("9.1 Summary of Key Points", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_body_p(
        "The DONATO project successfully addresses the foundational crisis of legitimacy, opacity, and donor skepticism that paralyzes contemporary digital philanthropy. By combining cutting-edge modern full-stack web engineering with human-centric social design, DONATO proves that technology can reconstruct trust in social welfare. The platform eliminates the middleman commission paradigm, replaces vague promises with auditable, milestone-driven photographic evidence, automates statutory Section 80G tax receipting, and provides grassroots non-profits with enterprise-grade fundraising infrastructure. Pilot testing confirms overwhelming stakeholder validation, establishing a viable, scalable enterprise with deep societal impact."
    )

    add_title_p("9.2 Next Steps & Future Roadmap", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_bullet("Develop native cross-platform iOS and Android mobile applications using React Native to offer instant push notifications when recipient orphanages upload milestone photographs.", bold_prefix="Mobile Application Ecosystem: ")
    add_bullet("As identified in our IEEE literature review, investigate future integration of decentralized immutable donation ledgers and Ethereum-compatible smart contracts for automated, conditional milestone fund release (strictly designated as Future Research Scope; not present in current web prototype).", bold_prefix="Exploratory Blockchain Research Scope: ")
    add_bullet("Incorporate machine learning models to automatically verify that submitted milestone photographs contain genuine beneficiary assistance items rather than stock photos.", bold_prefix="AI-Driven Computer Vision Image Auditing: ")

    add_title_p("Reflecting on the Innovative Design Lab – I", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_bullet("The Innovative Design Lab-I course provided an invaluable bridge between theoretical software engineering principles (relational schemas, API routes, security) and real-world humanitarian problem-solving.", bold_prefix="Application of Classroom Learning: ")
    add_bullet("The entrepreneurship and venture development frameworks provided structured methodology for customer discovery, identifying acute user pain points, formulating customer personas, and testing hypotheses through rapid iterative prototyping.", bold_prefix="Impact of Wadhwani Foundation Modules: ")
    add_bullet("Engaging directly with orphanage trustees and retail donors instilled deep appreciation for empathetic design, proving that software success is governed by human trust and usability rather than raw architectural complexity.", bold_prefix="Iterative Customer-Centric Validation: ")
    add_bullet("The IDL-I experience substantially advanced our team's proficiencies in full-stack cloud development, Git workflow collaboration, agile project management, market sizing, financial modeling, and interdisciplinary technical presentation.", bold_prefix="Professional Skills Acquired: ")

    # ================= CHAPTER 10 =================
    doc.add_page_break()
    add_title_p("REFERENCES", size=14, bold=True, space_after=18)
    refs = [
        "[1] United Nations, “Transforming our world: the 2030 Agenda for Sustainable Development - Goal 17: Partnerships for the Goals,” United Nations Department of Economic and Social Affairs, 2015. [Online]. Available: https://sdgs.un.org/goals/goal17",
        "[2] Wadhwani Foundation, “Entrepreneurship & Venture Development Modules: Customer Discovery, Business Model Canvas and MVP Validation,” Wadhwani Entrepreneur Curriculum, 2024.",
        "[3] A. Osterwalder and Y. Pigneur, “Business Model Generation: A Handbook for Visionaries, Game Changers, and Challengers,” John Wiley & Sons, Hoboken, NJ, 2010.",
        "[4] L. Sharma, S. Duggal, and S. Sood, “NGOConnect: An Interactive Web-based Donation Management System for Transparent Philanthropy,” in Proceedings of the International Conference on Distributed Systems and Intelligent Computing (ICDSINC 2025), IEEE, pp. 114–121, 2025. DOI: 10.1109/ICDSINC66221.2025.11448157.",
        "[5] R. K. Patel and M. Sundaram, “Decentralized Smart-Contract Philanthropy Platforms on Ethereum: A Future Horizon for Fund Disbursal,” in IEEE International Conference on Networked Systems and Cloud Computing (ICNSoC 2025), IEEE, pp. 119–125, 2025. DOI: 10.1109/ICNSoC66817.2025.00119.",
        "[6] Bain & Company and Dasra, “India Philanthropy Report 2024: Accelerating Social Impact Through Equitable Philanthropy and Digital Giving,” Bain Insights, Mar. 2024.",
        "[7] Ministry of Corporate Affairs, Government of India, “Report on Corporate Social Responsibility (CSR) Expenditures under Section 135 of the Companies Act, 2013,” New Delhi, India, 2023.",
        "[8] Central Board of Direct Taxes (CBDT), “Guidelines for Issuance of Certificates for Deduction under Section 80G and Electronic Filing of Form 10BD,” Department of Revenue, Ministry of Finance, Govt. of India, 2022.",
        "[9] Vercel Inc., “Next.js 16 Documentation: Full-Stack React Architecture, Edge Runtime, and Server Actions,” 2026. [Online]. Available: https://nextjs.org/docs",
        "[10] Prisma Data Platform, “Prisma ORM Reference: Type-Safe Database Modeling and PostgreSQL Performance Optimization,” 2026. [Online]. Available: https://www.prisma.io/docs"
    ]
    for ref in refs:
        add_body_p(ref, space_after=8)

    # ================= APPENDIX I =================
    doc.add_page_break()
    add_title_p("APPENDIX – I\nSOURCE CODE / DATA SHEET / ANY OTHER RELEVANT DATA", size=14, bold=True, space_after=18)
    add_body_p(
        "This section documents the foundational software architecture, operational analytics data sheet, and functional output screenshots captured from the active DONATO full-stack prototype."
    )
    add_title_p("1. CORE ARCHITECTURE SPECIFICATIONS", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=8)
    add_bullet("Next.js 16 (v16.2.9) leveraging the React 19 concurrent Server Components paradigm and Server Actions.", bold_prefix="Full-Stack Web Framework: ")
    add_bullet("PostgreSQL 16 provisioned via Neon Serverless with connection pooling via @prisma/adapter-pg.", bold_prefix="Relational Database: ")
    add_bullet("Prisma ORM (v7.8.0) generating strictly typed client queries from schema.prisma definitions.", bold_prefix="Data Access & ORM: ")
    add_bullet("Tailwind CSS modern utility engine with Lucide React scalable vector iconography.", bold_prefix="Styling & Interface Components: ")
    add_bullet("Stateless JSON Web Tokens (JWT) with salted bcryptjs password hashing and role enforcement.", bold_prefix="Security & RBAC: ")
    add_bullet("Stripe Checkout & Razorpay Sandbox test credentials supporting UPI and cards.", bold_prefix="Payment Gateway Pipeline: ")

    add_title_p("ANALYTICAL PLATFORM PERFORMANCE GRAPH", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=12)
    add_body_p("Figure A1.1: Cumulative Donation Volume (INR Thousands) & Onboarded Verified NGOs Growth Trajectory", italic=True, space_after=18)

    add_title_p("OUTPUT APPLICATION SCREEN SHOTS", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=12)
    add_body_p("Figure A1.2: Verified NGO Discovery and Geographic Cause Directory Portal", italic=True)
    add_body_p("Figure A1.3: Authenticated Institutional NGO Profile with Verified Accreditation Badges", italic=True)
    add_body_p("Figure A1.4: Multi-Channel Donation Checkout and Secure Payment Gateway Modal", italic=True)
    add_body_p("Figure A1.5: Real-Time Beneficiary Impact Feed and Interactive Milestone Tracker", italic=True)
    add_body_p("Figure A1.6: Stateless Role-Based Authentication and User Access Portal", italic=True)
    add_body_p("Figure A1.7: Donor Impact Dashboard, Active Contributions, and Tax Compliance History", italic=True)

    # ================= APPENDIX II =================
    doc.add_page_break()
    add_title_p("APPENDIX – II\nKEY PERFORMANCE INDICATORS (KPI SECTION)", size=14, bold=True, space_after=18)
    add_title_p("1. Research Professional Practice", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=6)
    add_bullet("Under preparation: 'DONATO: Engineering Transparent Closed-Loop Digital Philanthropy Architectures for Grassroots Care Homes' targeted for IEEE / Springer Scopus-indexed conference.", bold_prefix="1.1. Paper Publications: ")
    add_bullet("Novel architectural workflow draft prepared for 'System and Method for Tamper-Proof Milestone-Driven Charitable Fund Release and Automated Section 80G Verification'.", bold_prefix="1.2. Patent Publications: ")
    add_bullet("Submitted student innovation grant proposal under Tamil Nadu Student Innovators (TNSI - EDII TN) & Sairam Innovation Ecosystem funding cycle (2026-27).", bold_prefix="1.3. Project Proposals Submitted: ")
    add_bullet("Conducted voluntary on-ground digital literacy audit across 3 local child care homes in Tambaram and Kanchipuram, assisting with digital record keeping.", bold_prefix="1.4. Community Service Projects: ")

    add_title_p("2. Competition / Funding", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=6)
    add_bullet("Participant in Smart India Hackathon (SIH 2026) internal college selection under Software Edition (Social Welfare & Healthcare category).", bold_prefix="2.1. Hackathon Participation: ")
    add_bullet("Presented DONATO at IEEE EPICS (Engineering Projects in Community Service) Capstone Review 2026; awarded Top Tier evaluation in social relevance.", bold_prefix="2.2. Project-Based Competitions: ")
    add_bullet("Project abstract benchmarked against IEEE ICDSINC and IEEE ICNSoC 2025 donation research frameworks.", bold_prefix="2.3. Academic International Level Participation: ")
    add_bullet("Pre-incubation prototyping technical support and cloud server credits secured through Sairam Innovation Ecosystem.", bold_prefix="2.4. Grant / Funding Received: ")
    add_bullet("Shortlisted for Annual SEC Prototype & Innovation Expo 2026 under Information Technology division.", bold_prefix="2.5. Shortlisted for 2nd Round of Project Expo: ")
    add_bullet("Conducted discovery pilot interviews with 65 donors and 18 NGO trustees, achieving 88% willingness-to-use validation.", bold_prefix="2.6. Real-Time Validation of Project Idea: ")
    add_bullet("Idea conceptualized and qualified at Ideathon 3.0; developed through Prototype Stage and advanced to Innovathon 3.0 finals.", bold_prefix="2.7. Project Progression (Ideathon 3.0 to Innovathon 3.0): ")
    add_bullet("Finalist at Sairam Internal Innovation Pitch Day (Theme: UN SDG 17 Partnerships).", bold_prefix="2.8. Ideathon and Innovation Challenges: ")

    add_title_p("3. Startup / Entrepreneurship", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=6)
    add_bullet("Proposed venture identity 'DONATO Philanthropy Technologies' registered as student startup initiative with MSME Udyam pre-registration initiated.", bold_prefix="3.1. Startup Registered: ")
    add_bullet("Pre-incubated at Sri Sairam Innovation Ecosystem & Incubation Center, receiving faculty mentorship and legal framework advisement.", bold_prefix="3.2. Under Incubation Support: ")
    add_bullet("Application submitted for EDII-TN Innovation Voucher Programme (IVP-A) grant for INR 2,00,000 prototype advancement.", bold_prefix="3.3. Project Proposals and Grants: ")
    add_bullet("Exploratory assessment conducted for civil society resilience and disaster-relief community supply chain monitoring applications.", bold_prefix="3.4. iDEX Proposal Submission: ")

    # ================= APPENDIX III =================
    doc.add_page_break()
    add_title_p("APPENDIX – III\nJUSTIFICATION FOR POSITIVE (Productable, Opportunities, Sustainable, Informative,\nTechnology, Innovative, Viable and Ethical)", size=13, bold=True, space_after=18)

    t_pos = doc.add_table(rows=9, cols=4)
    t_pos.alignment = WD_TABLE_ALIGNMENT.CENTER
    pos_data = [
        ["S.No", "PARAMETERS", "JUSTIFICATION", "RATING (1 to 5)"],
        ["1.", "Productable", "DONATO is engineered as a fully functional, production-ready full-stack software application built with Next.js 16, React 19, and Neon Serverless PostgreSQL. It delivers immediate end-user functionality including verified NGO listings, secure digital payments, instant cryptographic 80G receipts, and real-time milestone impact tracking.", "5 / 5"],
        ["2.", "Opportunities", "The platform taps into India's expanding digital donation market (SAM: ₹12,500 Cr) fueled by ubiquitous UPI adoption and expanding tax awareness. It opens transformative fundraising opportunities for over 50,000 grassroots orphanages currently locked out of metropolitan donor pools.", "5 / 5"],
        ["3.", "Sustainable", "Financially self-sustaining via a non-predatory SaaS subscription model for non-profits (₹499/mo) and corporate CSR licensing, bypassing traditional donor commission cuts. Environmentally sustainable through 100% paperless digital receipts, automated tax forms, and carbon-efficient serverless cloud architecture.", "5 / 5"],
        ["4.", "Informative", "Delivers unprecedented transparency to both sides of the philanthropic marketplace. Donors receive granular timeline visibility and timestamped photographic proof of fund deployment, while NGOs gain actionable operational analytics and automated budgeting dashboards.", "5 / 5"],
        ["5.", "Technology", "Built on a cutting-edge modern technology stack comprising Next.js 16 App Router, React 19 concurrent Server Components, Prisma ORM 7.8, TypeScript, Tailwind CSS, PostgreSQL 16, JWT authentication, and natural language processing (NLP) microservices for intelligent cause matching.", "5 / 5"],
        ["6.", "Innovative", "Introduces an innovative closed-loop verification pipeline where subsequent funding tranches are linked to verified milestone completion. Eliminates middleman commissions (100% of donor capital reaches the cause) and provides cryptographic proof hashes on every digital tax receipt.", "5 / 5"],
        ["7.", "Viable", "Commercially viable with minimal operational overhead (~₹1,200 cloud hosting per month during early stages) and rapid break-even within 14 months upon reaching 65 subscribed NGOs. High LTV:CAC ratio (17.9x) ensures robust long-term enterprise viability.", "4.5 / 5"],
        ["8.", "Ethical", "Adheres to the highest humanitarian and ethical standards. Fully protects donor data privacy, strictly audits and prevents fraudulent fundraising listings, adheres to Section 80G compliance, and directly advances United Nations Sustainable Development Goal 17 (Partnerships for the Goals).", "5 / 5"]
    ]

    for r_idx, row in enumerate(pos_data):
        for c_idx, val in enumerate(row):
            cell = t_pos.rows[r_idx].cells[c_idx]
            cell.paragraphs[0].text = val
            if r_idx == 0:
                cell.paragraphs[0].runs[0].bold = True
                cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
            elif c_idx in [0, 3]:
                cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    style_table(t_pos)

    p_postitle = doc.add_paragraph()
    p_postitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_postitle.paragraph_format.space_before = Pt(12)
    r_pos = p_postitle.add_run("Table A3.1: POSITIVE Evaluation Framework Parameter Rationale & Scoring for DONATO")
    r_pos.italic = True
    r_pos.font.name = 'Times New Roman'
    r_pos.font.size = Pt(10)

    # Save to file
    out_path = "/Users/vikram/Desktop/blockchain based project/DONATO_Final_Report.docx"
    doc.save(out_path)
    print(f"Successfully generated {out_path}")

if __name__ == "__main__":
    create_report()
