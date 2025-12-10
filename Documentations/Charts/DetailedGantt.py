import plotly.figure_factory as ff
import plotly.graph_objects as go
import pandas as pd
from datetime import datetime, timedelta
import plotly.express as px

# Parse the project data
data = [
    {"task": "Project Setup", "start": "2025-11-05", "duration": 20, "type": "Integration", "assignee": "Both"},
    {"task": "Environment Setup", "start": "2025-11-05", "duration": 3, "type": "Integration", "assignee": "Both"},
    {"task": "MongoDB Schema Design", "start": "2025-11-08", "duration": 5, "type": "Backend", "assignee": "Backend Dev"},
    {"task": "React Project Setup", "start": "2025-11-08", "duration": 4, "type": "Frontend", "assignee": "Frontend Dev"},
    {"task": "Authentication System", "start": "2025-11-15", "duration": 8, "type": "Integration", "assignee": "Both"},
    {"task": "User Management API", "start": "2025-11-25", "duration": 8, "type": "Backend", "assignee": "Backend Dev"},
    {"task": "Product Management API", "start": "2025-12-05", "duration": 10, "type": "Backend", "assignee": "Backend Dev"},
    {"task": "Warehouse Management API", "start": "2025-12-19", "duration": 7, "type": "Backend", "assignee": "Backend Dev"},
    {"task": "Inventory Tracking API", "start": "2026-01-02", "duration": 10, "type": "Backend", "assignee": "Backend Dev"},
    {"task": "Invoice System API", "start": "2026-01-16", "duration": 12, "type": "Backend", "assignee": "Backend Dev"},
    {"task": "Payment System API", "start": "2026-02-03", "duration": 8, "type": "Backend", "assignee": "Backend Dev"},
    {"task": "User Auth UI", "start": "2025-11-25", "duration": 5, "type": "Frontend", "assignee": "Frontend Dev"},
    {"task": "Dashboard Layouts", "start": "2025-12-02", "duration": 8, "type": "Frontend", "assignee": "Frontend Dev"},
    {"task": "Product Mgmt UI", "start": "2025-12-12", "duration": 10, "type": "Frontend", "assignee": "Frontend Dev"},
    {"task": "Warehouse Mgmt UI", "start": "2025-12-26", "duration": 6, "type": "Frontend", "assignee": "Frontend Dev"},
    {"task": "Invoice Create UI", "start": "2026-01-06", "duration": 12, "type": "Frontend", "assignee": "Frontend Dev"},
    {"task": "Payment UI", "start": "2026-01-22", "duration": 8, "type": "Frontend", "assignee": "Frontend Dev"},
    {"task": "Customer Portal UI", "start": "2026-02-03", "duration": 8, "type": "Frontend", "assignee": "Frontend Dev"},
    {"task": "Reporting UI", "start": "2026-02-13", "duration": 10, "type": "Frontend", "assignee": "Frontend Dev"},
    {"task": "API Integration Test", "start": "2026-02-27", "duration": 8, "type": "Integration", "assignee": "Both"},
    {"task": "Payment Gateway", "start": "2026-03-09", "duration": 5, "type": "Backend", "assignee": "Backend Dev"},
    {"task": "Email/SMS Integ", "start": "2026-03-16", "duration": 4, "type": "Backend", "assignee": "Backend Dev"},
    {"task": "PDF Generation", "start": "2026-03-09", "duration": 6, "type": "Backend", "assignee": "Backend Dev"},
    {"task": "Real-time Notify", "start": "2026-03-22", "duration": 6, "type": "Integration", "assignee": "Both"},
    {"task": "Performance Opt", "start": "2026-03-30", "duration": 5, "type": "Integration", "assignee": "Both"},
    {"task": "Unit Testing", "start": "2026-04-06", "duration": 8, "type": "Integration", "assignee": "Both"},
    {"task": "Integration Test", "start": "2026-04-16", "duration": 6, "type": "Integration", "assignee": "Both"},
    {"task": "User Accept Test", "start": "2026-04-24", "duration": 5, "type": "Integration", "assignee": "Both"},
    {"task": "Bug Fixes", "start": "2026-05-01", "duration": 8, "type": "Integration", "assignee": "Both"},
    {"task": "Prod Deployment", "start": "2026-05-11", "duration": 3, "type": "Backend", "assignee": "Backend Dev"}
]

# Convert to DataFrame and process
df = pd.DataFrame(data)
df['Start'] = pd.to_datetime(df['start'])
df['Finish'] = df['Start'] + pd.to_timedelta(df['duration'], unit='D')

# Color mapping
color_map = {
    'Backend': '#1FB8CD',    # Blue
    'Frontend': '#D2BA4C',   # Orange
    'Integration': '#2E8B57'  # Green
}

# Create Gantt chart data for plotly
gantt_data = []
for idx, row in df.iterrows():
    gantt_data.append(dict(
        Task=row['task'],
        Start=row['Start'],
        Finish=row['Finish'],
        Resource=row['type']
    ))

# Create the Gantt chart
fig = ff.create_gantt(
    gantt_data,
    colors=color_map,
    index_col='Resource',
    show_colorbar=True,
    group_tasks=True,
    showgrid_x=True,
    showgrid_y=True,
    title="FlexInvoice Project Gantt Chart"
)

# Update layout
fig.update_layout(
    title="FlexInvoice Project Gantt Chart",
    xaxis_title="Timeline",
    yaxis_title="Tasks",
    legend=dict(
        orientation='h',
        yanchor='bottom',
        y=1.05,
        xanchor='center',
        x=0.5,
        title="Task Type"
    ),
    showlegend=True
)

# Update x-axis to show months
fig.update_xaxes(
    dtick="M1",
    tickformat="%b %Y"
)

# Save the chart
fig.write_image("gantt_chart.png")
fig.write_image("gantt_chart.svg", format="svg")

fig.show()