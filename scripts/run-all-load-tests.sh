#!/bin/bash

# This script runs load tests for various RPS values and endpoints.

# Ensure the service is running before executing this script.
# Example: npm run start:dev

# RPS configuration
# Easily modifiable variables to control the load tests

# Starting RPS value for the main sequence
START_RPS=100
# Step to increment RPS by
RPS_STEP=100
# Maximum RPS value
MAX_RPS=500

# Generate RPS values.
# We start with 10, then generate a sequence from START_RPS to MAX_RPS.
RPS_VALUES=(10 $(seq ${START_RPS} ${RPS_STEP} ${MAX_RPS}))

# Define endpoints and their corresponding k6 scripts and metrics
# Format: "endpoint_path:k6_script_name:metric_name"
ENDPOINTS=(
  "/health:generic-endpoint.js:response_time_ms"
  "/metrics:generic-endpoint.js:response_time_ms"
  "/auth/register:auth-register.js:register_duration_ms"
  "/auth/login:auth-login.js:login_duration_ms"
)

# Create a directory for results if it doesn't exist
mkdir -p load-test-results

# Ensure the k6 Docker image is built
echo "Building k6 Docker image..."
docker-compose -f docker-compose.load-test.yaml build k6

# Loop through each endpoint
for ENTRY in "${ENDPOINTS[@]}"; do
  IFS=':' read -r ENDPOINT K6_SCRIPT METRIC_NAME <<< "$ENTRY"
  echo "\n--- Running tests for endpoint: ${ENDPOINT} ---"

  # Loop through each RPS value
  for RPS in "${RPS_VALUES[@]}"; do
    echo "  Running test with ${RPS} RPS..."

    # Define output file name
    OUTPUT_FILE="load-test-results/load-test-results_$(echo ${ENDPOINT} | sed 's/[^a-zA-Z0-9_.-]/_/g')_${RPS}.txt"

    # Run the k6 test using docker-compose and save output to file
    # We capture stderr because k6 output goes to stderr by default in this setup
    OUTPUT=$(TARGET_ENDPOINT="${ENDPOINT}" TARGET_RPS="${RPS}" K6_SCRIPT="${K6_SCRIPT}" \
             docker-compose -f docker-compose.load-test.yaml run --rm k6 2>&1)

    echo "$OUTPUT" > "$OUTPUT_FILE"

    # Extract the average response time for the specified metric
    AVG_RESPONSE_TIME=$(echo "$OUTPUT" | grep "${METRIC_NAME}" | grep "avg" | awk '{print $2}')

    # Extract the http_req_failed rate (percentage of errors)
    # The output format is like: http_req_failed.........................................................: 0.00%  0 out of 300
    ERROR_PERCENTAGE=$(echo "$OUTPUT" | grep "http_req_failed" | grep -oP '\d+\.\d+%' | sed 's/%//')

    if [ -n "$AVG_RESPONSE_TIME" ]; then
      echo "    Average Response Time (${RPS} RPS): ${AVG_RESPONSE_TIME}ms"
    else
      echo "    Could not extract average response time. Check ${OUTPUT_FILE} for errors."
    fi

    if [ -n "$ERROR_PERCENTAGE" ]; then
      printf "    Error Percentage (%s RPS): %.2f%%\n" "${RPS}" "$ERROR_PERCENTAGE"
    else
      echo "    Could not extract error percentage. Check ${OUTPUT_FILE} for errors."
    fi
  done
done

echo "\nAll load tests completed. Full results saved in the 'load-test-results' directory."
