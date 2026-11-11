"""
generate_diagrams.py
Generates professional, high-resolution ER Diagram, Relational Schema Diagram,
and the consolidated 2-page submission PDF '9_Diagrams.pdf' for Team 9.
"""

import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

DIAGRAMS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(DIAGRAMS_DIR)

# -----------------------------------------------------------------------------
# 1. GENERATE ER DIAGRAM
# -----------------------------------------------------------------------------
# -----------------------------------------------------------------------------
# 1. GENERATE ER DIAGRAM (Clean, Academic University DBMS Style)
# -----------------------------------------------------------------------------
def generate_er_diagram():
    fig, ax = plt.subplots(figsize=(22, 13.8), dpi=300)
    ax.set_xlim(0, 22)
    ax.set_ylim(0, 13.8)
    ax.axis('off')

    # 1. Pure White Background
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#FFFFFF')

    # 2. Plain Academic Header (Prominent, High-Visibility)
    ax.text(11.0, 13.35, "ENTITY-RELATIONSHIP (ER) DIAGRAM", 
            color='#111827', fontsize=23, fontweight='bold', ha='center', va='center')
    ax.text(11.0, 12.92, "IoT Device Configuration & Compatibility Database  |  DBMS Mini-Project — Team 9", 
            color='#374151', fontsize=13.5, ha='center', va='center')
    ax.plot([0.6, 21.4], [12.60, 12.60], color='#D1D5DB', lw=1.2)

    # 3. 11 Conceptual Entities with Optimized Dimensions and Generous Spacing
    # Columns:
    # Col 1: x = 0.6, width = 3.6  (x_end = 4.2)
    # Gap 1: 4.2 to 5.8 (1.6 units)
    # Col 2: x = 5.8, width = 3.8  (x_end = 9.6)
    # Gap 2: 9.6 to 11.6 (2.0 units)
    # Col 3: x = 11.6, width = 3.8 (x_end = 15.4)
    # Gap 3: 15.4 to 17.4 (2.0 units)
    # Col 4: x = 17.4, width = 3.8 (x_end = 21.2)

    entities = {
        'MANUFACTURERS': {
            'pos': (0.6, 9.5, 3.6, 2.6),
            'pk': 'PK: manufacturer_id',
            'attrs': ['name', 'country', 'website']
        },
        'DEVICE_TYPES': {
            'pos': (0.6, 6.5, 3.6, 2.3),
            'pk': 'PK: device_type_id',
            'attrs': ['type_name', 'description']
        },
        'COMMUNICATION_PROTOCOLS': {
            'pos': (0.6, 1.9, 3.6, 2.6),
            'pk': 'PK: protocol_id',
            'attrs': ['protocol_name', 'protocol_layer', 'standard']
        },
        'DEVICES': {
            'pos': (5.8, 7.1, 3.8, 3.7),
            'pk': 'PK: device_id',
            'attrs': ['model_name', 'microcontroller', 'operating_voltage', 
                      'logic_level_voltage', 'status']
        },
        'FIRMWARE': {
            'pos': (5.8, 4.2, 3.8, 2.3),
            'pk': 'PK: firmware_id',
            'attrs': ['version_tag', 'runtime_environment', 'release_date']
        },
        'DEVICE_PROTOCOLS': {
            'pos': (5.8, 1.7, 3.8, 1.8),
            'pk': 'PK: (device_id, protocol_id)',
            'attrs': ['is_native_support']
        },
        'DEVICE_COMPONENTS': {
            'pos': (11.6, 9.6, 3.8, 2.3),
            'pk': 'PK: device_component_id',
            'attrs': ['default_bus_or_pin', 'tested_status']
        },
        'COMPATIBILITY': {
            'pos': (11.6, 4.9, 3.8, 3.4),
            'pk': 'PK: compatibility_id',
            'attrs': ['compatibility_status', 'voltage_compatible', 
                      'logic_level_compatible', 'notes']
        },
        'CONFIGURATION_NOTES': {
            'pos': (11.6, 1.7, 3.8, 2.5),
            'pk': 'PK: note_id',
            'attrs': ['title', 'content', 'note_type']
        },
        'COMPONENTS': {
            'pos': (17.4, 7.1, 3.8, 3.7),
            'pk': 'PK: component_id',
            'attrs': ['component_name', 'category', 'interface_type',
                      'operating_voltage_min', 'operating_voltage_max']
        },
        'LIBRARIES': {
            'pos': (17.4, 3.4, 3.8, 2.5),
            'pk': 'PK: library_id',
            'attrs': ['library_name', 'runtime_environment', 'latest_version']
        }
    }

    # 4. Draw Plain Entity Boxes (draw.io standard rectangular style)
    for name, data in entities.items():
        x, y, w, h = data['pos']

        # Entity Outline Box
        body = patches.Rectangle((x, y), w, h, fc='#FFFFFF', ec='#111827', lw=1.6, zorder=2)
        ax.add_patch(body)

        # Entity Header Compartment
        header_h = 0.68
        header = patches.Rectangle((x, y + h - header_h), w, header_h, fc='#F3F4F6', ec='#111827', lw=1.6, zorder=3)
        ax.add_patch(header)

        # Entity Name (Significantly larger & crisper font)
        ax.text(x + w/2, y + h - header_h/2, name, 
                color='#111827', fontsize=13.5, fontweight='bold', ha='center', va='center', zorder=4)

        # Primary Key (Distinct and bold)
        cur_y = y + h - header_h - 0.34
        ax.text(x + 0.22, cur_y, data['pk'], fontsize=11.8, fontweight='bold', color='#111827', zorder=4)
        cur_y -= 0.32

        # Divider line
        ax.plot([x, x + w], [cur_y + 0.12, cur_y + 0.12], color='#D1D5DB', lw=1.2, zorder=3)

        # Key Descriptive Attributes (High visibility font)
        for attr in data['attrs']:
            ax.text(x + 0.22, cur_y, f"• {attr}", fontsize=11.2, color='#1F2937', zorder=4)
            cur_y -= 0.31

    # 5. Helper function for drawing plain relationship lines
    def draw_rel(pts, card1, card2, label, label_pos, card1_pos=None, card2_pos=None):
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        ax.plot(xs, ys, color='#111827', lw=1.5, zorder=1)

        # Source Cardinality (1) - Large bold
        if card1_pos:
            ax.text(card1_pos[0], card1_pos[1], card1, fontsize=14.0, fontweight='bold', color='#111827', ha='center', va='center', zorder=5)

        # Target Cardinality (N) - Large bold
        if card2_pos:
            ax.text(card2_pos[0], card2_pos[1], card2, fontsize=14.0, fontweight='bold', color='#111827', ha='center', va='center', zorder=5)

        # Verb / Relationship label in clean minimal badge
        if label and label_pos:
            lx, ly = label_pos
            ax.text(lx, ly, f" {label} ", fontsize=10.5, style='italic', color='#111827', ha='center', va='center',
                    bbox=dict(boxstyle='square,pad=0.25', fc='#FFFFFF', ec='#6B7280', lw=1.0), zorder=6)

    # 6. Conceptual Relationships (Zero-crossing orthogonal routing)
    
    # 1. MANUFACTURERS -> DEVICES (1:N)
    draw_rel([(4.2, 10.5), (5.8, 10.5)], "1", "N", "produces", (5.0, 10.85),
             card1_pos=(4.45, 10.85), card2_pos=(5.55, 10.85))

    # 2. MANUFACTURERS -> COMPONENTS (1:N) (Overhead clean route)
    draw_rel([(2.4, 12.1), (2.4, 12.45), (19.3, 12.45), (19.3, 10.8)], "1", "N", "produces", (10.8, 12.45),
             card1_pos=(2.65, 12.28), card2_pos=(19.55, 11.05))

    # 3. DEVICE_TYPES -> DEVICES (1:N)
    draw_rel([(4.2, 8.4), (5.8, 8.4)], "1", "N", "categorizes", (5.0, 8.75),
             card1_pos=(4.45, 8.75), card2_pos=(5.55, 8.75))

    # 4. COMMUNICATION_PROTOCOLS -> DEVICE_PROTOCOLS (1:N)
    draw_rel([(4.2, 2.6), (5.8, 2.6)], "1", "N", "supported in", (5.0, 2.95),
             card1_pos=(4.45, 2.95), card2_pos=(5.55, 2.95))

    # 5. DEVICES -> DEVICE_PROTOCOLS (1:N) (Steps left into channel at x=5.1)
    draw_rel([(5.8, 7.3), (5.1, 7.3), (5.1, 2.0), (5.8, 2.0)], "1", "N", "supports", (5.1, 4.65),
             card1_pos=(5.60, 7.55), card2_pos=(5.55, 2.25))

    # 6. DEVICES -> FIRMWARE (1:N) (Vertical connection in gap 6.5 to 7.1)
    draw_rel([(7.7, 7.1), (7.7, 6.5)], "1", "N", "runs", (8.5, 6.8),
             card1_pos=(7.40, 6.95), card2_pos=(8.00, 6.65))

    # 7. DEVICES -> DEVICE_COMPONENTS (1:N)
    draw_rel([(9.6, 10.5), (11.6, 10.5)], "1", "N", "wires to", (10.6, 10.85),
             card1_pos=(9.9, 10.85), card2_pos=(11.3, 10.85))

    # 8. COMPONENTS -> DEVICE_COMPONENTS (1:N)
    draw_rel([(17.4, 10.5), (15.4, 10.5)], "1", "N", "wired in", (16.4, 10.85),
             card1_pos=(17.1, 10.85), card2_pos=(15.7, 10.85))

    # 9. DEVICES -> COMPATIBILITY (1:N)
    draw_rel([(9.6, 7.8), (11.6, 7.8)], "1", "N", "evaluated in", (10.6, 8.15),
             card1_pos=(9.9, 8.15), card2_pos=(11.3, 8.15))

    # 10. COMPONENTS -> COMPATIBILITY (1:N)
    draw_rel([(17.4, 7.8), (15.4, 7.8)], "1", "N", "evaluated in", (16.4, 8.15),
             card1_pos=(17.1, 8.15), card2_pos=(15.7, 8.15))

    # 11. FIRMWARE -> COMPATIBILITY (1:N)
    draw_rel([(9.6, 5.3), (11.6, 5.8)], "1", "N", "tested on", (10.6, 5.55),
             card1_pos=(9.9, 5.05), card2_pos=(11.3, 6.10))

    # 12. LIBRARIES -> COMPATIBILITY (1:N)
    draw_rel([(17.4, 4.6), (15.4, 5.8)], "1", "N", "requires", (16.4, 5.2),
             card1_pos=(17.1, 4.30), card2_pos=(15.7, 6.10))

    # 13. DEVICES -> CONFIGURATION_NOTES (1:N) (Route via open lower channel at y=1.0)
    draw_rel([(5.8, 7.7), (4.6, 7.7), (4.6, 1.0), (12.6, 1.0), (12.6, 1.7)], "1", "N", "has notes", (8.5, 1.0),
             card1_pos=(5.20, 7.95), card2_pos=(12.9, 1.45))

    # 14. COMPONENTS -> CONFIGURATION_NOTES (1:N) (Route via open right/lower channel)
    draw_rel([(21.2, 8.5), (21.6, 8.5), (21.6, 1.0), (14.4, 1.0), (14.4, 1.7)], "1", "N", "has notes", (18.0, 1.0),
             card1_pos=(21.4, 8.75), card2_pos=(14.7, 1.45))

    # 7. Clean Minimal Academic Legend
    leg_x, leg_y, leg_w, leg_h = 0.6, 0.30, 14.5, 0.65
    leg_box = patches.Rectangle((leg_x, leg_y), leg_w, leg_h, fc='#FFFFFF', ec='#9CA3AF', lw=1.1, zorder=2)
    ax.add_patch(leg_box)
    ax.text(leg_x + 0.30, leg_y + leg_h/2, 
            "NOTATION:  [PK] = Primary Key  |  1 = One  |  N = Many  |  Associative entities resolve M:N relationships", 
            fontsize=11.5, color='#1F2937', va='center', zorder=4)

    plt.tight_layout()
    
    png_path = os.path.join(DIAGRAMS_DIR, "ER_Diagram.png")
    pdf_path = os.path.join(DIAGRAMS_DIR, "ER_Diagram.pdf")
    
    plt.savefig(png_path, dpi=300, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.savefig(pdf_path, dpi=300, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close()
    print(f"Generated: {png_path} and {pdf_path}")


# -----------------------------------------------------------------------------
# 2. GENERATE RELATIONAL SCHEMA DIAGRAM
# -----------------------------------------------------------------------------
def generate_schema_diagram():
    fig, ax = plt.subplots(figsize=(24, 15), dpi=300)
    ax.set_xlim(0, 24)
    ax.set_ylim(0, 15)
    ax.axis('off')

    bg_color = '#F1F5F9'
    fig.patch.set_facecolor(bg_color)
    ax.set_facecolor(bg_color)

    # Title Header Banner
    header_box = patches.FancyBboxPatch(
        (0.8, 13.8), 22.4, 0.95,
        boxstyle="round,pad=0.2",
        fc='#0F172A', ec='#020617', lw=2
    )
    ax.add_patch(header_box)
    ax.text(12.0, 14.38, "RELATIONAL SCHEMA DIAGRAM (PHYSICAL DATA MODEL)", 
            color='white', fontsize=18, fontweight='bold', ha='center', va='center')
    ax.text(12.0, 13.98, "PostgreSQL 16 + pgvector Schema Architecture | Team 9 (PES2UG24CS196, PES2UG24CS192)", 
            color='#94A3B8', fontsize=11, ha='center', va='center')

    # Detailed Table Definitions (name, pos, header_color, columns: (name, type, constraint))
    tables = {
        'manufacturers': {
            'pos': (0.8, 10.2, 4.0, 2.8),
            'color': '#1E40AF',
            'cols': [
                ('manufacturer_id', 'SERIAL', 'PK, NOT NULL'),
                ('name', 'VARCHAR(100)', 'UNIQUE, NOT NULL'),
                ('website', 'VARCHAR(255)', 'NULL'),
                ('country', 'VARCHAR(100)', 'NULL'),
                ('created_at', 'TIMESTAMPTZ', 'DEFAULT now()')
            ]
        },
        'device_types': {
            'pos': (0.8, 6.8, 4.0, 2.4),
            'color': '#1E40AF',
            'cols': [
                ('device_type_id', 'SERIAL', 'PK, NOT NULL'),
                ('type_name', 'VARCHAR(50)', 'UNIQUE, NOT NULL'),
                ('description', 'TEXT', 'NULL')
            ]
        },
        'devices': {
            'pos': (5.8, 7.0, 4.8, 5.8),
            'color': '#1D4ED8',
            'cols': [
                ('device_id', 'SERIAL', 'PK, NOT NULL'),
                ('manufacturer_id', 'INT', 'FK -> manufacturers'),
                ('device_type_id', 'INT', 'FK -> device_types'),
                ('model_name', 'VARCHAR(100)', 'UNIQUE, NOT NULL'),
                ('microcontroller', 'VARCHAR(100)', 'NULL'),
                ('operating_voltage', 'NUMERIC(4,2)', 'CHECK (>0, <=48V)'),
                ('logic_level_voltage', 'NUMERIC(4,2)', 'CHECK (>0, <=12V)'),
                ('clock_speed_mhz', 'INT', 'CHECK (>0)'),
                ('flash_memory_kb', 'INT', 'CHECK (>=0)'),
                ('sram_kb', 'INT', 'CHECK (>=0)'),
                ('gpio_count', 'INT', 'DEFAULT 0'),
                ('analog_pins_count', 'INT', 'DEFAULT 0'),
                ('status', 'VARCHAR(20)', 'CHECK (enum active...)'),
                ('created_at', 'TIMESTAMPTZ', 'DEFAULT now()')
            ]
        },
        'components': {
            'pos': (18.6, 7.5, 4.6, 5.1),
            'color': '#0F766E',
            'cols': [
                ('component_id', 'SERIAL', 'PK, NOT NULL'),
                ('manufacturer_id', 'INT', 'FK -> manufacturers'),
                ('component_name', 'VARCHAR(100)', 'NOT NULL'),
                ('category', 'VARCHAR(50)', 'NOT NULL'),
                ('operating_voltage_min', 'NUMERIC(4,2)', 'CHECK (>0)'),
                ('operating_voltage_max', 'NUMERIC(4,2)', 'CHECK (>= min)'),
                ('logic_level_voltage', 'NUMERIC(4,2)', 'CHECK (>0)'),
                ('current_draw_ma', 'NUMERIC(6,2)', 'CHECK (>=0)'),
                ('interface_type', 'VARCHAR(50)', 'NOT NULL'),
                ('datasheet_url', 'VARCHAR(255)', 'NULL (ALTER DDL)'),
                ('created_at', 'TIMESTAMPTZ', 'DEFAULT now()')
            ]
        },
        'communication_protocols': {
            'pos': (0.8, 2.0, 4.2, 3.2),
            'color': '#B45309',
            'cols': [
                ('protocol_id', 'SERIAL', 'PK, NOT NULL'),
                ('protocol_name', 'VARCHAR(50)', 'UNIQUE, NOT NULL'),
                ('protocol_layer', 'VARCHAR(30)', 'CHECK (enum)'),
                ('standard', 'VARCHAR(100)', 'NULL'),
                ('max_data_rate_kbps', 'NUMERIC(10,2)', 'CHECK (>0)')
            ]
        },
        'device_protocols': {
            'pos': (6.0, 2.4, 4.4, 2.6),
            'color': '#92400E',
            'cols': [
                ('device_id', 'INT', 'PK, FK -> devices'),
                ('protocol_id', 'INT', 'PK, FK -> protocols'),
                ('is_native_support', 'BOOLEAN', 'DEFAULT true')
            ]
        },
        'firmware': {
            'pos': (6.0, 4.8, 4.4, 2.8),
            'color': '#4338CA',
            'cols': [
                ('firmware_id', 'SERIAL', 'PK, NOT NULL'),
                ('device_id', 'INT', 'FK -> devices'),
                ('version_tag', 'VARCHAR(50)', 'NOT NULL'),
                ('runtime_environment', 'VARCHAR(50)', 'NOT NULL'),
                ('release_date', 'DATE', 'NOT NULL'),
                ('is_recommended', 'BOOLEAN', 'DEFAULT false')
            ]
        },
        'libraries': {
            'pos': (18.6, 2.0, 4.6, 3.4),
            'color': '#047857',
            'cols': [
                ('library_id', 'SERIAL', 'PK, NOT NULL'),
                ('library_name', 'VARCHAR(100)', 'NOT NULL'),
                ('runtime_environment', 'VARCHAR(50)', 'NOT NULL'),
                ('repository_url', 'VARCHAR(255)', 'NULL'),
                ('latest_version', 'VARCHAR(30)', 'NOT NULL'),
                ('license', 'VARCHAR(50)', 'DEFAULT \'MIT\''),
                ('created_at', 'TIMESTAMPTZ', 'DEFAULT now()')
            ]
        },
        'device_components': {
            'pos': (12.2, 10.4, 4.8, 2.8),
            'color': '#6D28D9',
            'cols': [
                ('device_component_id', 'SERIAL', 'PK, NOT NULL'),
                ('device_id', 'INT', 'FK -> devices'),
                ('component_id', 'INT', 'FK -> components'),
                ('default_bus_or_pin', 'VARCHAR(100)', 'NOT NULL'),
                ('tested_status', 'VARCHAR(20)', 'CHECK (VERIFIED...)')
            ]
        },
        'compatibility': {
            'pos': (12.0, 4.6, 5.0, 4.8),
            'color': '#B91C1C',
            'cols': [
                ('compatibility_id', 'SERIAL', 'PK, NOT NULL'),
                ('device_id', 'INT', 'FK -> devices'),
                ('component_id', 'INT', 'FK -> components'),
                ('library_id', 'INT', 'FK -> libraries (NULL)'),
                ('firmware_id', 'INT', 'FK -> firmware (NULL)'),
                ('compatibility_status', 'VARCHAR(30)', 'CHECK (COMPATIBLE...)'),
                ('voltage_compatible', 'BOOLEAN', 'NOT NULL'),
                ('logic_level_compatible', 'BOOLEAN', 'NOT NULL'),
                ('notes', 'TEXT', 'NULL'),
                ('verified_date', 'DATE', 'DEFAULT CURRENT_DATE')
            ]
        },
        'configuration_notes': {
            'pos': (12.0, 0.8, 5.0, 3.2),
            'color': '#334155',
            'cols': [
                ('note_id', 'SERIAL', 'PK, NOT NULL'),
                ('device_id', 'INT', 'FK -> devices (NULL)'),
                ('component_id', 'INT', 'FK -> components (NULL)'),
                ('title', 'VARCHAR(150)', 'NOT NULL'),
                ('content', 'TEXT', 'NOT NULL'),
                ('note_type', 'VARCHAR(30)', 'CHECK (SETUP_GUIDE...)'),
                ('embedding', 'vector(384)', 'pgvector HNSW INDEX'),
                ('updated_at', 'TIMESTAMPTZ', 'TRIGGER AUDITED')
            ]
        }
    }

    # Draw Schema Tables
    for name, data in tables.items():
        x, y, w, h = data['pos']
        
        # Shadow
        shadow = patches.FancyBboxPatch((x+0.06, y-0.06), w, h, boxstyle="round,pad=0.06", fc='#CBD5E1', ec='none', zorder=1)
        ax.add_patch(shadow)

        # Body Box
        body = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.06", fc='white', ec='#64748B', lw=1.5, zorder=2)
        ax.add_patch(body)

        # Header Box
        header_h = 0.52
        header = patches.Rectangle((x, y + h - header_h), w, header_h, fc=data['color'], ec='none', zorder=3)
        ax.add_patch(header)
        ax.text(x + w/2, y + h - header_h/2, name.upper(), color='white', fontsize=10, fontweight='bold', ha='center', va='center', zorder=4)

        # Column text
        cur_y = y + h - header_h - 0.22
        for col_name, col_type, col_desc in data['cols']:
            # Highlight PK / FK / VEC
            if 'PK' in col_desc and 'FK' in col_desc:
                badge = "[PFK]"
                color_name = '#991B1B'
            elif 'PK' in col_desc:
                badge = "[PK] "
                color_name = '#B91C1C'
            elif 'FK' in col_desc:
                badge = "[FK] "
                color_name = '#1D4ED8'
            elif 'vector' in col_type:
                badge = "[VEC]"
                color_name = '#7C3AED'
            else:
                badge = "     "
                color_name = '#0F172A'

            ax.text(x + 0.12, cur_y, f"{badge} {col_name}", fontsize=7.2, fontweight='bold', color=color_name, zorder=4)
            ax.text(x + w - 0.12, cur_y, f"{col_type}", fontsize=6.8, color='#64748B', ha='right', zorder=4)
            cur_y -= 0.20

    # Draw Explicit FK -> PK Connectors
    def draw_fk_arrow(start_pt, end_pt, color='#2563EB', rad=0.0):
        ax.annotate("", xy=end_pt, xytext=start_pt,
                    arrowprops=dict(arrowstyle="-|>", color=color, lw=1.5, mutation_scale=10,
                                    connectionstyle=f"arc3,rad={rad}"))

    # devices.manufacturer_id -> manufacturers.manufacturer_id
    draw_fk_arrow((5.8, 11.8), (4.8, 11.8), '#1E40AF')
    
    # devices.device_type_id -> device_types.device_type_id
    draw_fk_arrow((5.8, 11.4), (4.8, 8.4), '#1E40AF', rad=0.1)

    # components.manufacturer_id -> manufacturers.manufacturer_id
    draw_fk_arrow((18.6, 11.8), (4.8, 12.4), '#1E40AF', rad=-0.12)

    # device_protocols.device_id -> devices.device_id
    draw_fk_arrow((7.2, 4.6), (7.2, 7.0), '#92400E')

    # device_protocols.protocol_id -> communication_protocols.protocol_id
    draw_fk_arrow((6.0, 3.4), (5.0, 3.4), '#B45309')

    # firmware.device_id -> devices.device_id
    draw_fk_arrow((6.0, 6.6), (5.8, 8.0), '#4338CA', rad=0.2)

    # device_components.device_id -> devices.device_id
    draw_fk_arrow((12.2, 12.0), (10.6, 12.0), '#6D28D9')

    # device_components.component_id -> components.component_id
    draw_fk_arrow((17.0, 12.0), (18.6, 12.0), '#6D28D9')

    # compatibility.device_id -> devices.device_id
    draw_fk_arrow((12.0, 8.4), (10.6, 9.4), '#B91C1C')

    # compatibility.component_id -> components.component_id
    draw_fk_arrow((17.0, 8.4), (18.6, 9.4), '#B91C1C')

    # compatibility.library_id -> libraries.library_id
    draw_fk_arrow((17.0, 5.8), (18.6, 4.4), '#047857')

    # compatibility.firmware_id -> firmware.firmware_id
    draw_fk_arrow((12.0, 5.8), (10.4, 5.8), '#4338CA')

    # configuration_notes.device_id -> devices.device_id
    draw_fk_arrow((12.0, 2.6), (9.8, 7.0), '#334155', rad=-0.1)

    # configuration_notes.component_id -> components.component_id
    draw_fk_arrow((17.0, 2.6), (19.4, 7.8), '#334155', rad=0.1)

    # Schema Legend Box
    s_legend = patches.FancyBboxPatch((0.8, 0.4), 10.0, 1.2, boxstyle="round,pad=0.1", fc='white', ec='#94A3B8', lw=1)
    ax.add_patch(s_legend)
    ax.text(1.0, 1.35, "SCHEMA ANNOTATIONS & INTEGRITY RULES:", fontsize=8.5, fontweight='bold', color='#0F172A')
    ax.text(1.0, 1.05, "[PK] Primary Key    [FK] Foreign Key    [VEC] Vector Type Column [vector(384)]", fontsize=7.5, color='#334155')
    ax.text(1.0, 0.75, "Arrows point directly from Foreign Key (Child Column) ──> Primary Key (Parent Column).", fontsize=7.5, color='#334155')
    ax.text(1.0, 0.50, "All Foreign Keys enforce referential integrity with CASCADE, RESTRICT, or SET NULL.", fontsize=7.2, color='#64748B')

    plt.tight_layout()

    png_path = os.path.join(DIAGRAMS_DIR, "Schema_Diagram.png")
    pdf_path = os.path.join(DIAGRAMS_DIR, "Schema_Diagram.pdf")

    plt.savefig(png_path, dpi=300, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.savefig(pdf_path, dpi=300, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close()
    print(f"Generated: {png_path} and {pdf_path}")


# -----------------------------------------------------------------------------
# 3. COMPILE CONSOLIDATED SUBMISSION PDF: 9_Diagrams.pdf (EXACTLY 2 PAGES)
# -----------------------------------------------------------------------------
def compile_submission_diagrams_pdf():
    pdf_path = os.path.join(PROJECT_ROOT, "9_Diagrams.pdf")
    
    # Page size: Landscape Letter (792 x 612 points)
    # Margins: 18 pt horizontal, 14 pt vertical -> Printable: 756 pt x 584 pt
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=landscape(letter),
        leftMargin=18,
        rightMargin=18,
        topMargin=14,
        bottomMargin=14
    )

    styles = getSampleStyleSheet()
    header_style = ParagraphStyle(
        'HeaderBanner',
        parent=styles['Normal'],
        fontSize=9.5,
        leading=12,
        textColor=colors.HexColor('#0F172A'),
        alignment=1,
        spaceAfter=3
    )
    section_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=11,
        leading=13,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=0,
        spaceAfter=3
    )

    story = []

    # ==================== PAGE 1: ER DIAGRAM ====================
    story.append(Paragraph(
        "<b>DBMS Experiential Learning (Level 3)</b> &nbsp;|&nbsp; "
        "<b>IoT Device Configuration & Compatibility Database</b> &nbsp;|&nbsp; "
        "<b>Team 9</b> (PES2UG24CS196, PES2UG24CS192) &nbsp;|&nbsp; "
        "<b>PostgreSQL 16 + pgvector</b>",
        header_style
    ))
    story.append(Paragraph("<b>1. Entity-Relationship (ER) Diagram (Conceptual Data Model)</b>", section_style))
    er_img_path = os.path.join(DIAGRAMS_DIR, "ER_Diagram.png")
    if os.path.exists(er_img_path):
        story.append(RLImage(er_img_path, width=756, height=515))
    story.append(PageBreak())

    # ==================== PAGE 2: SCHEMA DIAGRAM ====================
    story.append(Paragraph(
        "<b>DBMS Experiential Learning (Level 3)</b> &nbsp;|&nbsp; "
        "<b>IoT Device Configuration & Compatibility Database</b> &nbsp;|&nbsp; "
        "<b>Team 9</b> (PES2UG24CS196, PES2UG24CS192) &nbsp;|&nbsp; "
        "<b>PostgreSQL 16 + pgvector</b>",
        header_style
    ))
    story.append(Paragraph("<b>2. Relational Schema Diagram (Physical Data Model & DDL Architecture)</b>", section_style))
    schema_img_path = os.path.join(DIAGRAMS_DIR, "Schema_Diagram.png")
    if os.path.exists(schema_img_path):
        story.append(RLImage(schema_img_path, width=756, height=515))

    doc.build(story)
    print(f"Compiled clean 2-page consolidated submission PDF: {pdf_path}")


if __name__ == "__main__":
    generate_er_diagram()
    generate_schema_diagram()
    compile_submission_diagrams_pdf()
