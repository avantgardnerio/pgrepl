#!/usr/bin/env bash
kubectl delete deployments --all
kubectl delete services --all
kubectl delete pods --all
kubectl delete loadbalancers --all
