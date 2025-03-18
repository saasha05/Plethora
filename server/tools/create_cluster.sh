#!/bin/bash

# MongoDB Atlas Cluster Creation Script
# Cluster name from first argument
CLUSTER_NAME="PlethoraDb"

# Create Atlas cluster with default configurations
atlas cluster create "$CLUSTER_NAME" \
  --provider AWS \
  --region US_EAST_1 \
  --tier M0 \
  --tag env=dev \

# Check if cluster creation was successful
if [ $? -eq 0 ]; then
    echo "Cluster $CLUSTER_NAME created successfully!"
else
    echo "Failed to create cluster $CLUSTER_NAME"
    exit 1
fi
