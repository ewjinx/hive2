import time
import json
from utils.calculator import add, multiply, is_prime

print("🔧 Starting Complex Hive Job...")
time.sleep(1)

# Load test cases
print("📥 Loading test cases...")
with open("tests/test_inputs.json") as f:
    data = json.load(f)
cases = data["cases"]
time.sleep(1)

results = []

print("🚀 Running computations...\n")

for idx, case in enumerate(cases):
    a, b = case["a"], case["b"]
    print(f"--- Test Case #{idx+1} ---")
    print(f"Inputs: a={a}, b={b}")

    s = add(a, b)
    m = multiply(a, b)
    p = is_prime(s)

    print(f"Sum: {s}")
    print(f"Product: {m}")
    print(f"Is Sum Prime? {p}")

    results.append({
        "a": a,
        "b": b,
        "sum": s,
        "product": m,
        "is_sum_prime": p
    })

    # Simulate heavy work
    time.sleep(1)
    print()

print("📄 Writing output to report.txt...")
with open("report.txt", "w") as f:
    f.write("Hive Complex Job Report\n")
    f.write("=======================\n\n")
    for r in results:
        f.write(f"Inputs: {r['a']}, {r['b']}\n")
        f.write(f"Sum = {r['sum']}\n")
        f.write(f"Product = {r['product']}\n")
        f.write(f"Is Sum Prime? {r['is_sum_prime']}\n")
        f.write("\n")

print("✅ Job completed successfully!")
