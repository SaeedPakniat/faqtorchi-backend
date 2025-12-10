import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
from datetime import datetime, timedelta

# Create the data from the provided JSON
data = [
    {"phase": "1. Project Analysis & Planning", "start": "2025-11-05", "duration": 14, "type": "Planning", "color": "blue"},
    {"phase": "2. Requirements Specification", "start": "2025-11-19", "duration": 14, "type": "Planning", "color": "blue"},
    {"phase": "3. System Architecture Design", "start": "2025-12-03", "duration": 14, "type": "Design", "color": "green"},
    {"phase": "4. Database Design", "start": "2025-12-17", "duration": 14, "type": "Design", "color": "green"},
    {"phase": "5. Backend Development", "start": "2025-12-31", "duration": 70, "type": "Development", "color": "orange"},
    {"phase": "6. Frontend Development", "start": "2025-12-31", "duration": 70, "type": "Development", "color": "orange"},
    {"phase": "7. Integration with Third-Party APIs", "start": "2026-03-11", "duration": 21, "type": "Development", "color": "orange"},
    {"phase": "8. Security Implementation", "start": "2026-04-01", "duration": 14, "type": "Development", "color": "orange"},
    {"phase": "9. Testing & Debugging", "start": "2026-04-15", "duration": 28, "type": "Testing", "color": "red"},
    {"phase": "10. Reporting & Analytics Module", "start": "2026-03-25", "duration": 21, "type": "Development", "color": "orange"},
    {"phase": "11. Deployment & Delivery", "start": "2026-05-13", "duration": 14, "type": "Deployment", "color": "purple"},
    {"phase": "12. Documentation & Training", "start": "2026-05-06", "duration": 21, "type": "Deployment", "color": "purple"}
]

# Convert to DataFrame and process dates
df = pd.DataFrame(data)
df['Start'] = pd.to_datetime(df['start'])
df['Finish'] = df['Start'] + pd.to_timedelta(df['duration'], unit='D')

# Create abbreviated phase names for display (15 char limit)
df['Phase_Short'] = [
    "1. Proj Analysis",
    "2. Requirements",
    "3. Sys Architect",
    "4. DB Design",
    "5. Backend Dev",
    "6. Frontend Dev",
    "7. API Integrat",
    "8. Security Impl",
    "9. Test & Debug",
    "10. Report Mod",
    "11. Deployment",
    "12. Doc & Train"
]

# Define color mapping
color_map = {
    'Planning': '#1FB8CD',     # Strong cyan
    'Design': '#2E8B57',       # Sea green
    'Development': '#D2BA4C',   # Moderate yellow
    'Testing': '#DB4545',       # Bright red
    'Deployment': '#5D878F'     # Cyan
}

# Use plotly express timeline for Gantt chart
fig = px.timeline(df,
                  x_start="Start",
                  x_end="Finish",
                  y="Phase_Short",
                  color="type",
                  color_discrete_map=color_map,
                  title="FlexInvoice Project Timeline")

# Update layout
fig.update_layout(
    xaxis_title="Timeline",
    yaxis_title="Project Phase",
    yaxis=dict(categoryorder='array', categoryarray=df['Phase_Short'][::-1]),
    legend=dict(orientation='h', yanchor='bottom', y=1.05, xanchor='center', x=0.5)
)

# Update traces for better hover info
fig.update_traces(
    hovertemplate='<b>%{y}</b><br>Start: %{x}<br>End: %{x2}<br>Type: %{legendgroup}<extra></extra>'
)

# Save as both PNG and SVG
fig.write_image("gantt_chart.png")
fig.write_image("gantt_chart.svg", format="svg")

fig.show()