import os
import time
import random

def run_monte_carlo(iterations):
    inside_circle = 0
    for _ in range(iterations):
        x = random.random()
        y = random.random()
        if x**2 + y**2 <= 1.0:
            inside_circle += 1
    return (inside_circle / iterations) * 4

if __name__ == '__main__':
    array_index = int(os.getenv('HIVE_ARRAY_INDEX', '1'))
    
    print("=========================================")
    print("🚀 HIVE DISTRIBUTED COMPUTE PLATFORM 🚀")
    print("=========================================")
    print(f"Allocated Task Node ID: #{array_index}")
    print(f"Workload: Monte Carlo Pi Estimation")
    print("-----------------------------------------")
    
    random.seed(array_index * 42)
    iterations = 10_000_000
    print(f"-> Processing {iterations:,} intensive stochastic simulations...")
    
    start = time.time()
    estimated_pi = run_monte_carlo(iterations)
    duration = time.time() - start
    
    print("-----------------------------------------")
    print(f"✅ TASK SUCCESS")
    print(f"📊 Estimated Pi:   {estimated_pi:.6f}")
    print(f"⏱️ Compute Time:   {duration:.2f} seconds")
    print("=========================================")
