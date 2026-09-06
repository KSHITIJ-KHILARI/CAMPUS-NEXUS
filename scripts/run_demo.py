#!/usr/bin/env python3
"""
Campus NEXUS Demo Mode Runner
Simulates campus events for demonstration purposes.
"""

import asyncio
import random
from datetime import datetime, timedelta

# Demo scenarios that can be triggered
DEMO_SCENARIOS = {
    "CANTEEN_RUSH": {
        "name": "Simulate Canteen Rush",
        "description": "Canteen crowd spikes to HIGH",
        "actions": ["update_crowd_canteen_high", "notify_students"]
    },
    "LIFT_FAILURE": {
        "name": "Simulate Lift Failure",
        "description": "Aurobindo Lift 2 becomes UNAVAILABLE",
        "actions": ["update_lift_status", "notify_affected_classes", "update_digital_twin"]
    },
    "LAB_FAILURE": {
        "name": "Simulate Lab Failure",
        "description": "Lab 304 becomes UNAVAILABLE",
        "actions": ["update_lab_status", "notify_affected_classes", "run_simulation"]
    },
    "CLASSROOM_CHANGE": {
        "name": "Simulate Classroom Change",
        "description": "DBMS class moves from Aurobindo 302 to Bhaskar 506",
        "actions": ["update_classroom", "notify_students", "notify_faculty"]
    },
    "TIMETABLE_CONFLICT": {
        "name": "Simulate Timetable Conflict",
        "description": "Creates student/faculty conflicts",
        "actions": ["create_conflict", "notify_students", "notify_faculty"]
    },
    "CAMPUS_EVENT": {
        "name": "Simulate Campus Event",
        "description": "Event at Gargi Plaza with crowd prediction",
        "actions": ["create_event", "predict_crowd", "notify_students"]
    },
    "ISSUE_REPORTS": {
        "name": "Simulate Issue Reports",
        "description": "Generates multiple issue reports for clustering",
        "actions": ["generate_issues", "cluster_issues"]
    }
}

async def run_demo_scenario(scenario_key: str):
    """Run a specific demo scenario."""
    if scenario_key not in DEMO_SCENARIOS:
        print(f"Unknown scenario: {scenario_key}")
        return
    
    scenario = DEMO_SCENARIOS[scenario_key]
    print(f"\n🎬 Running demo scenario: {scenario['name']}")
    print(f"   {scenario['description']}")
    print(f"   Actions: {', '.join(scenario['actions'])}")
    
    # In a real implementation, this would:
    # 1. Update database state
    # 2. Create Digital Twin events
    # 3. Run impact analysis
    # 4. Trigger notifications
    # 5. Update all dashboards
    
    print("   ✅ Scenario completed")

async def run_all_demos():
    """Run all demo scenarios in sequence."""
    print("🎬 Campus NEXUS Demo Mode")
    print("=" * 50)
    
    for scenario_key in DEMO_SCENARIOS:
        await run_demo_scenario(scenario_key)
        await asyncio.sleep(1)
    
    print("\n✅ All demo scenarios completed")

def print_scenarios():
    """Print available demo scenarios."""
    print("\n🎬 Available Demo Scenarios:")
    print("-" * 50)
    for key, scenario in DEMO_SCENARIOS.items():
        print(f"  {key}: {scenario['name']}")
        print(f"     {scenario['description']}")
    print()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        scenario = sys.argv[1].upper()
        if scenario == "ALL":
            asyncio.run(run_all_demos())
        elif scenario in DEMO_SCENARIOS:
            asyncio.run(run_demo_scenario(scenario))
        else:
            print(f"Unknown scenario: {scenario}")
            print_scenarios()
    else:
        print_scenarios()
