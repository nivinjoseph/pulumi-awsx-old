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
     * Creates an AWS/EFS metric with the requested [metricName]. See
     * https://docs.aws.amazon.com/efs/latest/ug/monitoring-cloudwatch.html for list of all
     * metric-names.
     *
     * Note, individual metrics can easily be obtained without supplying the name using the other
     * [metricXXX] functions.
     *
     * You can monitor file systems using Amazon CloudWatch, which collects and processes raw data from
     * Amazon EFS into readable, near real-time metrics. These statistics are recorded for a period of
     * 15 months, so that you can access historical information and gain a better perspective on how
     * your web application or service is performing. By default, Amazon EFS metric data is
     * automatically sent to CloudWatch at 1-minute periods.
     *
     * Amazon EFS metrics use the EFS namespace and provides metrics for a single dimension,
     * "FileSystemId". A file system's ID can be found in the Amazon EFS management console, and it
     * takes the form of fs-XXXXXXXX.
     */
    function metric(metricName, change = {}) {
        const dimensions = {};
        if (change.fileSystem !== undefined) {
            dimensions.FileSystemId = change.fileSystem.id;
        }
        return new cloudwatch.Metric(Object.assign({ namespace: "AWS/EFS", name: metricName }, change)).withDimensions(dimensions);
    }
    /**
     * The number of burst credits that a file system has.
     *
     * Burst credits allow a file system to burst to throughput levels above a file system’s
     * baseline level for periods of time. For more information, see Throughput scaling in Amazon
     * EFS.
     *
     * The Minimum statistic is the smallest burst credit balance for any minute during the period.
     * The Maximum statistic is the largest burst credit balance for any minute during the period.
     * The Average statistic is the average burst credit balance during the period.
     *
     * Units: Bytes
     *
     * Valid statistics: Minimum, Maximum, Average
     */
    function burstCreditBalance(change) {
        return metric("BurstCreditBalance", Object.assign({ unit: "Bytes" }, change));
    }
    metrics.burstCreditBalance = burstCreditBalance;
    /**
     * The number of client connections to a file system. When using a standard client, there is one
     * connection per mounted Amazon EC2 instance.
     *
     * Note: To calculate the average ClientConnections for periods greater than one minute, divide
     * the Sum statistic by the number of minutes in the period.
     *
     * Units: Count of client connections
     *
     * Valid statistics: Sum
     */
    function clientConnections(change) {
        return metric("ClientConnections", Object.assign({ statistic: "Sum", unit: "Count" }, change));
    }
    metrics.clientConnections = clientConnections;
    /**
     * The number of bytes for each file system read operation.
     *
     * The Sum statistic is the total number of bytes associated with read operations. The Minimum
     * statistic is the size of the smallest read operation during the period. The Maximum statistic
     * is the size of the largest read operation during the period. The Average statistic is the
     * average size of read operations during the period. The SampleCount statistic provides a count
     * of read operations.
     *
     * Units:
     * * Bytes for Minimum, Maximum, Average, and Sum.
     * * Count for SampleCount.
     *
     * Valid statistics: Minimum, Maximum, Average, Sum, SampleCount
     */
    function dataReadIOBytes(change) {
        return metric("DataReadIOBytes", Object.assign({ unit: "Bytes" }, change));
    }
    metrics.dataReadIOBytes = dataReadIOBytes;
    /**
     * The number of bytes for each file write operation.
     *
     * The Sum statistic is the total number of bytes associated with write operations. The Minimum
     * statistic is the size of the smallest write operation during the period. The Maximum
     * statistic is the size of the largest write operation during the period. The Average statistic
     * is the average size of write operations during the period. The SampleCount statistic provides
     * a count of write operations.
     *
     * Units:
     * * Bytes for Minimum, Maximum, Average, and Sum.
     * * Count for SampleCount.
     *
     * Valid statistics: Minimum, Maximum, Average, Sum, SampleCount
     */
    function dataWriteIOBytes(change) {
        return metric("DataWriteIOBytes", Object.assign({ unit: "Bytes" }, change));
    }
    metrics.dataWriteIOBytes = dataWriteIOBytes;
    /**
     * The number of bytes for each metadata operation.
     *
     * The Sum statistic is the total number of bytes associated with metadata operations. The
     * Minimum statistic is the size of the smallest metadata operation during the period. The
     * Maximum statistic is the size of the largest metadata operation during the period. The
     * Average statistic is the size of the average metadata operation during the period. The
     * SampleCount statistic provides a count of metadata operations.
     *
     * Units:
     * * Bytes for Minimum, Maximum, Average, and Sum.
     * * Count for SampleCount.
     *
     * Valid statistics: Minimum, Maximum, Average, Sum, SampleCount
     */
    function metadataIOBytes(change) {
        return metric("MetadataIOBytes", Object.assign({ unit: "Bytes" }, change));
    }
    metrics.metadataIOBytes = metadataIOBytes;
    /**
     * Shows how close a file system is to reaching the I/O limit of the General Purpose performance
     * mode. If this metric is at 100% more often than not, consider moving your application to a
     * file system using the Max I/O performance mode.
     *
     * Note: This metric is only submitted for file systems using the General Purpose performance
     * mode.
     *
     * Units: Percent
     */
    function percentIOLimit(change) {
        return metric("PercentIOLimit", Object.assign({ unit: "Percent" }, change));
    }
    metrics.percentIOLimit = percentIOLimit;
    /**
     * The maximum amount of throughput a file system is allowed. For file systems in the
     * Provisioned Throughput mode, if the amount of storage allows your file system to drive a
     * higher amount of throughput than you provisioned, this metric will reflect the higher
     * throughput instead of the provisioned amount. For file systems in the Bursting Throughput
     * mode, this value is a function of the file system size and BurstCreditBalance. For more
     * information, see Amazon EFS Performance.
     *
     * The Minimum statistic is the smallest throughput permitted for any minute during the period.
     * The Maximum statistic is the highest throughput permitted for any minute during the period.
     * The Average statistic is the average throughput permitted during the period.
     *
     * Units: Bytes per second
     *
     * Valid statistics: Minimum, Maximum, Average
     */
    function permittedThroughput(change) {
        return metric("PermittedThroughput", Object.assign({ unit: "Bytes/Second" }, change));
    }
    metrics.permittedThroughput = permittedThroughput;
    /**
     * The number of bytes for each file system operation, including data read, data write, and
     * metadata operations.
     *
     * The Sum statistic is the total number of bytes associated with all file system operations.
     * The Minimum statistic is the size of the smallest operation during the period. The Maximum
     * statistic is the size of the largest operation during the period. The Average statistic is
     * the average size of an operation during the period. The SampleCount statistic provides a
     * count of all operations.
     *
     * Note: To calculate the average operations per second for a period, divide the SampleCount
     * statistic by the number of seconds in the period. To calculate the average throughput (Bytes
     * per second) for a period, divide the Sum statistic by the number of seconds in the period.
     *
     * Units:
     * Bytes for Minimum, Maximum, Average, and Sum statistics.
     * Count for SampleCount.
     *
     * Valid statistics: Minimum, Maximum, Average, Sum, SampleCount
     */
    function totalIOBytes(change) {
        return metric("TotalIOBytes", Object.assign({ unit: "Percent" }, change));
    }
    metrics.totalIOBytes = totalIOBytes;
})(metrics = exports.metrics || (exports.metrics = {}));
//# sourceMappingURL=metrics.js.map