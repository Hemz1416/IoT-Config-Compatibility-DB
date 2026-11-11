"""
generate_evidence_pdf.py
Compiles the official submission PDF '9_DDL.pdf' for Team 9
using the student's authentic live terminal execution screenshots (1.png to 10.png).
"""

import os
from PIL import Image as PILImage
from reportlab.lib.pagesizes import letter, portrait
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

EVIDENCE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(EVIDENCE_DIR)

def get_scaled_image(img_filename, max_width=520, max_height=260):
    """Calculates proportional width and height preserving original aspect ratio."""
    img_path = os.path.join(EVIDENCE_DIR, img_filename)
    if not os.path.exists(img_path):
        return None
    with PILImage.open(img_path) as im:
        orig_w, orig_h = im.size
    aspect = orig_w / orig_h

    # Fit within max_width and max_height
    target_w = min(orig_w, max_width)
    target_h = target_w / aspect
    if target_h > max_height:
        target_h = max_height
        target_w = target_h * aspect

    return RLImage(img_path, width=target_w, height=target_h)

def compile_submission_ddl_pdf():
    pdf_path = os.path.join(PROJECT_ROOT, "9_DDL.pdf")
    
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=portrait(letter),
        leftMargin=36,
        rightMargin=36,
        topMargin=28,
        bottomMargin=28
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=15,
        leading=19,
        textColor=colors.HexColor('#0F172A'),
        alignment=1,
        spaceAfter=3
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontSize=9.0,
        leading=12,
        textColor=colors.HexColor('#334155'),
        alignment=1,
        spaceAfter=8
    )
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=10.5,
        leading=13,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=4,
        spaceAfter=2
    )
    body_style = ParagraphStyle(
        'BodyDesc',
        parent=styles['Normal'],
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#475569'),
        spaceAfter=3
    )

    story = []

    # ==================== PAGE 1 ====================
    story.append(Paragraph("<b>DBMS Experiential Learning — Level 3 Mini-Project</b>", title_style))
    story.append(Paragraph("<b>Live DDL & Database Query Execution Evidence Report</b><br/>"
                           "<b>Project Title:</b> IoT Device Configuration & Compatibility Database<br/>"
                           "<b>Team Number:</b> 9 &nbsp;|&nbsp; <b>Database:</b> PostgreSQL 16.15 + pgvector (v0.6.0)<br/>"
                           "<b>Students:</b> 1. Hitha Shree Suresh (PES2UG24CS196) &nbsp;&nbsp;|&nbsp;&nbsp; 2. Hemant Ram Nelapati (PES2UG24CS192)", subtitle_style))
    story.append(Spacer(1, 2))

    # Evidence 1: Connection
    story.append(Paragraph("<b>1. PostgreSQL 16 Connection & pgvector Extension Setup</b>", section_style))
    story.append(Paragraph("Verification of connection to database <code>iot_config_db</code> and active <code>vector</code> (v0.6.0) extension.", body_style))
    img1 = get_scaled_image("1.png", max_width=530, max_height=110)
    if img1:
        story.append(img1)
    story.append(Spacer(1, 6))

    # Evidence 2: Tables
    story.append(Paragraph("<b>2. Schema Introspection (11 Base Tables + 3 Views)</b>", section_style))
    story.append(Paragraph("PostgreSQL <code>information_schema.tables</code> catalog verifying all 11 relational tables and 3 views.", body_style))
    img2 = get_scaled_image("2.png", max_width=300, max_height=220)
    if img2:
        story.append(img2)
    story.append(Spacer(1, 6))

    # Evidence 3: ALTER TABLE
    story.append(Paragraph("<b>3. Schema Evolution via ALTER TABLE</b>", section_style))
    story.append(Paragraph("Demonstration of <code>ALTER TABLE components ADD COLUMN datasheet_url VARCHAR(255);</code> in catalog.", body_style))
    img3 = get_scaled_image("3.png", max_width=500, max_height=120)
    if img3:
        story.append(img3)
    story.append(PageBreak())

    # ==================== PAGE 2 ====================
    # Evidence 4: Constraints
    story.append(Paragraph("<b>4. Constraint Enforcement (PK, FK, UNIQUE, CHECK Constraints)</b>", section_style))
    story.append(Paragraph("Introspection of domain CHECK rules, foreign keys, primary keys, and unique constraints in <code>table_constraints</code>.", body_style))
    img4 = get_scaled_image("4.png", max_width=440, max_height=280)
    if img4:
        story.append(img4)
    story.append(Spacer(1, 6))

    # Evidence 5: Views & HNSW
    story.append(Paragraph("<b>5. Advanced Feature 1 & 2: Analytical Views & HNSW Vector Index</b>", section_style))
    story.append(Paragraph("Query execution against <code>v_device_compatibility_overview</code> and HNSW vector index catalog.", body_style))
    img5 = get_scaled_image("5.png", max_width=510, max_height=260)
    if img5:
        story.append(img5)
    story.append(PageBreak())

    # ==================== PAGE 3 ====================
    # Evidence 6: Trigger
    story.append(Paragraph("<b>6. Advanced Feature 3: Database Trigger & Stored Function</b>", section_style))
    story.append(Paragraph("Verification of <code>trg_config_notes_updated_at</code> automatically updating the <code>updated_at</code> timestamp on ROW UPDATE.", body_style))
    img6 = get_scaled_image("6.png", max_width=470, max_height=260)
    if img6:
        story.append(img6)
    story.append(Spacer(1, 6))

    # Evidence 7: HAVING
    story.append(Paragraph("<b>7. DML Operations: Aggregation with GROUP BY and HAVING Clause</b>", section_style))
    story.append(Paragraph("Analytical query filtering IoT boards supporting at least 4 communication protocols (<code>HAVING COUNT(dp.protocol_id) >= 4</code>).", body_style))
    img7 = get_scaled_image("7.png", max_width=530, max_height=180)
    if img7:
        story.append(img7)
    story.append(PageBreak())

    # ==================== PAGE 4 ====================
    # Evidence 8: DELETE
    story.append(Paragraph("<b>8. DML Operations: Transaction-Safe DELETE Statement</b>", section_style))
    story.append(Paragraph("Demonstration of safe row insertion, existence verification, deletion, and rollback/commit within an ACID transaction.", body_style))
    img8 = get_scaled_image("8.png", max_width=470, max_height=200)
    if img8:
        story.append(img8)
    story.append(Spacer(1, 6))

    # Evidence 9: Vector Search
    story.append(Paragraph("<b>9. Advanced Feature 4: pgvector Cosine Similarity Semantic Search</b>", section_style))
    story.append(Paragraph("Semantic query matching technical documentation notes using cosine distance operator (<code><=></code>).", body_style))
    img9 = get_scaled_image("9.png", max_width=500, max_height=190)
    if img9:
        story.append(img9)
    story.append(Spacer(1, 6))

    # Evidence 10: Row Counts
    story.append(Paragraph("<b>10. Database Population Verification (81 Seed Records Total)</b>", section_style))
    story.append(Paragraph("Row count verification across all 11 normalized tables confirming exactly 81 seed records.", body_style))
    img10 = get_scaled_image("10.png", max_width=440, max_height=210)
    if img10:
        story.append(img10)

    doc.build(story)
    print(f"Successfully compiled 9_DDL.pdf with user's authentic screenshots: {pdf_path}")

if __name__ == "__main__":
    compile_submission_ddl_pdf()
