import matplotlib.pyplot as plt
import numpy as np

# Set figure size and DPI for academic report quality
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
fig, ax1 = plt.subplots(figsize=(8, 4.5), dpi=300)

months = [f'M{i}' for i in range(1, 13)]
donations = [25, 45, 80, 150, 220, 340, 480, 670, 840, 1080, 1320, 1650] # in Thousands INR
ngos = [2, 4, 7, 12, 18, 25, 34, 48, 62, 78, 96, 120]

# Primary axis: Donations Disbursed
color_donations = '#1e40af' # Deep blue
ax1.set_xlabel('Project Operational Timeline (Months)', fontsize=11, fontweight='bold', labelpad=8, family='serif')
ax1.set_ylabel('Cumulative Donations Disbursed (INR in Thousands)', color=color_donations, fontsize=10, fontweight='bold', labelpad=8, family='serif')
line1 = ax1.plot(months, donations, color=color_donations, marker='o', linewidth=2.2, markersize=5, label='Donations Disbursed (INR k)')
ax1.tick_params(axis='y', labelcolor=color_donations)
ax1.set_ylim(0, 1800)

# Secondary axis: Verified NGOs
ax2 = ax1.twinx()
color_ngos = '#059669' # Emerald green
ax2.set_ylabel('Verified Onboarded NGOs', color=color_ngos, fontsize=10, fontweight='bold', labelpad=8, family='serif')
line2 = ax2.plot(months, ngos, color=color_ngos, marker='s', linewidth=2.2, markersize=5, linestyle='-', label='Verified NGOs')
ax2.tick_params(axis='y', labelcolor=color_ngos)
ax2.set_ylim(0, 130)

# Combine legends
lines = line1 + line2
labels = [l.get_label() for l in lines]
ax1.legend(lines, labels, loc='upper left', frameon=True, framealpha=0.9, fontsize=9.5)

plt.title('DONATO Platform Growth Trajectory: Funds Disbursed vs. Verified NGOs', fontsize=12, fontweight='bold', pad=12, family='serif')
plt.tight_layout()

output_path = '/Users/vikram/Desktop/blockchain based project/assets/fig_a1_1_growth_chart.png'
plt.savefig(output_path, dpi=300)
print(f"Chart saved to {output_path}")
