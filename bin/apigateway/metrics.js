"use strict";
// Copyright 2016-2018, Pulumi Corporation.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Object.defineProperty(exports, "__esModule", { value: true });
const cloudwatch = require("../cloudwatch");
var metrics;
(function (metrics) {
    /**
     * Creates an AWS/ApiGateway metric with the requested [metricName]. See
     * https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-metrics-and-dimensions.html
     * for list of all metric-names.
     *
     * Note, individual metrics can easily be obtained without supplying the name using the other
     * [metricXXX] functions.
     *
     * You can use the dimensions in the following table to filter API Gateway metrics.
     *
     * 1. "ApiName": Filters API Gateway metrics for an API of the specified API name.
     * 2. "ApiName, Method, Resource, Stage": Filters API Gateway metrics for an API method of the
     *    specified API, stage, resource, and method.
     *
     *    API Gateway will not send such metrics unless you have explicitly enabled detailed CloudWatch
     *    metrics. You can do this in the console by selecting Enable CloudWatch Metrics under a stage
     *    Settings tab. Alternatively, you can call the stage:update action of the API Gateway REST API
     *    to update the metricsEnabled property to true.
     *
     *    Enabling such metrics will incur additional charges to your account. For pricing information,
     *    see Amazon CloudWatch Pricing.
     * 3. "ApiName, Stage": Filters API Gateway metrics for an API stage of the specified API and stage.
     */
    function metric(metricName, change = {}) {
        const dimensions = {};
        if (change.restApi !== undefined) {
            dimensions.ApiName = change.restApi.name;
        }
        if (change.api !== undefined) {
            dimensions.ApiName = change.api.restAPI.name;
        }
        if (change.method !== undefined) {
            dimensions.Method = change.method;
        }
        if (change.resource !== undefined) {
            dimensions.Resource = change.resource;
        }
        if (change.stage !== undefined) {
            dimensions.Stage = change.stage;
        }
        return new cloudwatch.Metric(Object.assign({ namespace: "AWS/ApiGateway", name: metricName }, change)).withDimensions(dimensions);
    }
    /**
     * The number of client-side errors captured in a specified period.
     *
     * The Sum statistic represents this metric, namely, the total count of the 4XXError errors in the
     * given period. The Average statistic represents the 4XXError error rate, namely, the total count
     * of the 4XXError errors divided by the total number of requests during the period. The denominator
     * corresponds to the Count metric (below).
     *
     * Unit: Count
     */
    function error4XX(change) {
        return metric("4XXError", Object.assign({ unit: "Count" }, change));
    }
    metrics.error4XX = error4XX;
    /**
     * The number of server-side errors captured in a given period.
     *
     * The Sum statistic represents this metric, namely, the total count of the 5XXError errors in the
     * given period. The Average statistic represents the 5XXError error rate, namely, the total count
     * of the 5XXError errors divided by the total number of requests during the period. The denominator
     * corresponds to the Count metric (below).
     *
     * Unit: Count
     */
    function error5XX(change) {
        return metric("5XXError", Object.assign({ unit: "Count" }, change));
    }
    metrics.error5XX = error5XX;
    /**
     * The number of requests served from the API cache in a given period.
     *
     * The Sum statistic represents this metric, namely, the total count of the cache hits in the
     * specified period. The Average statistic represents the cache hit rate, namely, the total count of
     * the cache hits divided by the total number of requests during the period. The denominator
     * corresponds to the Count metric (below).
     */
    function cacheHitCount(change) {
        return metric("CacheHitCount", Object.assign({ unit: "Count" }, change));
    }
    metrics.cacheHitCount = cacheHitCount;
    /**
     * The number of requests served from the back end in a given period, when API caching is enabled.
     *
     * The Sum statistic represents this metric, namely, the total count of the cache misses in the
     * specified period. The Average statistic represents the cache miss rate, namely, the total count
     * of the cache hits divided by the total number of requests during the period. The denominator
     * corresponds to the Count metric (below).
     *
     * Unit: Count
     */
    function cacheMissCount(change) {
        return metric("CacheMissCount", Object.assign({ unit: "Count" }, change));
    }
    metrics.cacheMissCount = cacheMissCount;
    /**
     * The total number API requests in a given period.
     *
     * The SampleCount statistic represents this metric.
     *
     * Unit: Count
     */
    function count(change) {
        return metric("Count", Object.assign({ unit: "Count" }, change));
    }
    metrics.count = count;
    /**
     * The time between when API Gateway relays a request to the back end and when it receives a
     * response from the back end.
     *
     * Unit: Milliseconds
     */
    function integrationLatency(change) {
        return metric("IntegrationLatency", Object.assign({ unit: "Milliseconds" }, change));
    }
    metrics.integrationLatency = integrationLatency;
    /**
     * The time between when API Gateway receives a request from a client and when it returns a response
     * to the client. The latency includes the integration latency and other API Gateway overhead.
     *
     * Unit: Milliseconds
     */
    function latency(change) {
        return metric("Latency", Object.assign({ unit: "Milliseconds" }, change));
    }
    metrics.latency = latency;
})(metrics = exports.metrics || (exports.metrics = {}));
//# sourceMappingURL=metrics.js.map