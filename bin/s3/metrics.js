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
     * Creates an AWS/S3 metric with the requested [metricName]. See
     * https://docs.aws.amazon.com/AmazonS3/latest/dev/cloudwatch-monitoring.html for list of all
     * metric-names.
     *
     * Note, individual metrics can easily be obtained without supplying the name using the other
     * [metricXXX] functions.
     *
     * Amazon CloudWatch metrics for Amazon S3 can help you understand and improve the performance
     * of applications that use Amazon S3. There are two ways that you can use CloudWatch with
     * Amazon S3.
     *
     * Daily Storage Metrics for Buckets ‐ You can monitor bucket storage using CloudWatch, which
     * collects and processes storage data from Amazon S3 into readable, daily metrics. These
     * storage metrics for Amazon S3 are reported once per day and are provided to all customers at
     * no additional cost.
     *
     * Request metrics ‐ You can choose to monitor Amazon S3 requests to quickly identify and act on
     * operational issues. The metrics are available at 1 minute intervals after some latency to
     * process. These CloudWatch metrics are billed at the same rate as the Amazon CloudWatch Custom
     * Metrics. For information on CloudWatch pricing, see Amazon CloudWatch Pricing. To learn more
     * about how to opt-in to getting these metrics, see Metrics Configurations for Buckets.
     *
     * When enabled, request metrics are reported for all object operations. By default, these
     * 1-minute metrics are available at the Amazon S3 bucket level. You can also define a filter
     * for the metrics collected –using a shared prefix or object tag– allowing you to align metrics
     * filters to specific business applications, workflows, or internal organizations.
     *
     * The following dimensions are used to filter Amazon S3 metrics:
     *
     * 1. "BucketName": This dimension filters the data you request for the identified bucket only.
     * 2. "StorageType": This dimension filters the data that you have stored in a bucket by the
     *    following types of storage:
     *
     *   * StandardStorage - The number of bytes used for objects in the STANDARD storage class.
     *   * IntelligentTieringFAStorage - The number of bytes used for objects in the Frequent Access
     *     tier of INTELLIGENT_TIERING storage class.
     *   * IntelligentTieringIAStorage - The number of bytes used for objects in the Infrequent
     *     Access tier of INTELLIGENT_TIERING storage class.
     *   * StandardIAStorage - The number of bytes used for objects in the Standard - Infrequent
     *     Access (STANDARD_IA) storage class.
     *   * StandardIASizeOverhead - The number of bytes used for objects smaller than 128 KB in size
     *     in the STANDARD_IA storage class.
     *   * OneZoneIAStorage - The number of bytes used for objects in the OneZone - Infrequent
     *     Access (ONEZONE_IA) storage class.
     *   * OneZoneIASizeOverhead - The number of bytes used for objects smaller than 128 KB in size
     *     in the ONEZONE_IA storage class.
     *   * ReducedRedundancyStorage - The number of bytes used for objects in the Reduced Redundancy
     *     Storage (RRS) class.
     *   * GlacierStorage - The number of bytes used for objects in the Glacier (GLACIER) storage
     *     class.
     *   * GlacierStorageOverhead - For each object archived to Glacier, Amazon S3 uses 8 KB of
     *     storage for the name of the object and other metadata. You are charged standard Amazon S3
     *     rates for this additional storage. For each archived object, Glacier adds 32 KB of
     *     storage for index and related metadata. This extra data is necessary to identify and
     *     restore your object. You are charged Glacier rates for this additional storage.
     *
     * 3. "FilterId": This dimension filters metrics configurations that you specify for request
     *    metrics on a bucket, for example, a prefix or a tag. You specify a filter id when you
     *    create a metrics configuration. For more information, see
     *    [Metrics-Configurations-for-Buckets](https://docs.aws.amazon.com/AmazonS3/latest/dev/metrics-configurations.html).
     */
    function metric(metricName, change = {}) {
        const dimensions = {};
        if (change.bucket !== undefined) {
            dimensions.BucketName = change.bucket.bucket;
        }
        if (change.storageType !== undefined) {
            dimensions.StorageType = change.storageType;
        }
        if (change.filterId !== undefined) {
            dimensions.FilterId = change.filterId;
        }
        return new cloudwatch.Metric(Object.assign({ namespace: "AWS/S3", name: metricName }, change)).withDimensions(dimensions);
    }
    /**
     * The amount of data in bytes stored in a bucket in the STANDARD storage class,
     * INTELLIGENT_TIERING storage class, Standard - Infrequent Access (STANDARD_IA) storage class,
     * OneZone - Infrequent Access (ONEZONE_IA), Reduced Redundancy Storage (RRS) class, or Glacier
     * (GLACIER) storage class. This value is calculated by summing the size of all objects in the
     * bucket (both current and noncurrent objects), including the size of all parts for all
     * incomplete multipart uploads to the bucket.
     *
     * Units: Bytes
     *
     * Valid statistics: Average
     */
    function bucketSizeBytes(change) {
        return metric("BucketSizeBytes", Object.assign({ unit: "Bytes" }, change));
    }
    metrics.bucketSizeBytes = bucketSizeBytes;
    /**
     * The total number of objects stored in a bucket for all storage classes except for the GLACIER
     * storage class. This value is calculated by counting all objects in the bucket (both current
     * and noncurrent objects) and the total number of parts for all incomplete multipart uploads to
     * the bucket.
     *
     * Units: Count
     *
     * Valid statistics: Average
     */
    function numberOfObjects(change) {
        return metric("NumberOfObjects", Object.assign({ unit: "Count" }, change));
    }
    metrics.numberOfObjects = numberOfObjects;
    /**
     * The total number of HTTP requests made to an Amazon S3 bucket, regardless of type. If you're
     * using a metrics configuration with a filter, then this metric only returns the HTTP requests
     * made to the objects in the bucket that meet the filter's requirements.
     *
     * Units: Count
     *
     * Valid statistics: Sum
     */
    function allRequests(change) {
        return metric("AllRequests", Object.assign({ statistic: "Sum", unit: "Count" }, change));
    }
    metrics.allRequests = allRequests;
    /**
     * The number of HTTP GET requests made for objects in an Amazon S3 bucket. This doesn't include
     * list operations.
     *
     * Note: Paginated list-oriented requests, like List Multipart Uploads, List Parts, Get Bucket
     * Object versions, and others, are not included in this metric.
     *
     * Units: Count
     *
     * Valid statistics: Sum
     */
    function getRequests(change) {
        return metric("GetRequests", Object.assign({ statistic: "Sum", unit: "Count" }, change));
    }
    metrics.getRequests = getRequests;
    /**
     * The number of HTTP PUT requests made for objects in an Amazon S3 bucket.
     *
     * Units: Count
     *
     * Valid statistics: Sum
     */
    function putRequests(change) {
        return metric("PutRequests", Object.assign({ statistic: "Sum", unit: "Count" }, change));
    }
    metrics.putRequests = putRequests;
    /**
     * The number of HTTP DELETE requests made for objects in an Amazon S3 bucket. This also
     * includes Delete Multiple Objects requests. This metric shows the number of requests, not the
     * number of objects deleted.
     *
     * Units: Count
     *
     * Valid statistics: Sum
     */
    function deleteRequests(change) {
        return metric("DeleteRequests", Object.assign({ statistic: "Sum", unit: "Count" }, change));
    }
    metrics.deleteRequests = deleteRequests;
    /**
     * The number of HTTP HEAD requests made to an Amazon S3 bucket.
     *
     * Units: Count
     *
     * Valid statistics: Sum
     */
    function headRequests(change) {
        return metric("HeadRequests", Object.assign({ statistic: "Sum", unit: "Count" }, change));
    }
    metrics.headRequests = headRequests;
    /**
     * The number of HTTP POST requests made to an Amazon S3 bucket.
     *
     * Note: Delete Multiple Objects and SELECT Object Content requests are not included in this
     * metric.
     *
     * Units: Count
     *
     * Valid statistics: Sum
     */
    function postRequests(change) {
        return metric("PostRequests", Object.assign({ statistic: "Sum", unit: "Count" }, change));
    }
    metrics.postRequests = postRequests;
    /**
     * The number of Amazon S3 SELECT Object Content requests made for objects in an Amazon S3
     * bucket.
     *
     * Units: Count
     *
     * Valid statistics: Sum
     */
    function selectRequests(change) {
        return metric("SelectRequests", Object.assign({ statistic: "Sum", unit: "Count" }, change));
    }
    metrics.selectRequests = selectRequests;
    /**
     * The number of bytes of data scanned with Amazon S3 SELECT Object Content requests in an
     * Amazon S3 bucket.
     *
     * Units: Bytes
     *
     * Valid statistics: Average (bytes per request), Sum (bytes per period), Sample Count, Min, Max
     */
    function selectScannedBytes(change) {
        return metric("SelectScannedBytes", Object.assign({ unit: "Bytes" }, change));
    }
    metrics.selectScannedBytes = selectScannedBytes;
    /**
     * The number of bytes of data returned with Amazon S3 SELECT Object Content requests in an
     * Amazon S3 bucket.
     *
     * Units: Bytes
     *
     * Valid statistics: Average (bytes per request), Sum (bytes per period), Sample Count, Min, Max
     */
    function selectReturnedBytes(change) {
        return metric("SelectReturnedBytes", Object.assign({ unit: "Bytes" }, change));
    }
    metrics.selectReturnedBytes = selectReturnedBytes;
    /**
     * The number of HTTP requests that list the contents of a bucket.
     *
     * Units: Count
     *
     * Valid statistics: Sum
     */
    function listRequests(change) {
        return metric("ListRequests", Object.assign({ statistic: "Sum", unit: "Bytes" }, change));
    }
    metrics.listRequests = listRequests;
    /**
     * The number bytes downloaded for requests made to an Amazon S3 bucket, where the response
     * includes a body.
     *
     * Units: Bytes
     *
     * Valid statistics: Average (bytes per request), Sum (bytes per period), Sample Count, Min, Max
     */
    function bytesDownloaded(change) {
        return metric("BytesDownloaded", Object.assign({ unit: "Bytes" }, change));
    }
    metrics.bytesDownloaded = bytesDownloaded;
    /**
     * The number bytes uploaded that contain a request body, made to an Amazon S3 bucket.
     *
     * Units: Bytes
     *
     * Valid statistics: Average (bytes per request), Sum (bytes per period), Sample Count, Min, Max
     */
    function bytesUploaded(change) {
        return metric("BytesUploaded", Object.assign({ unit: "Bytes" }, change));
    }
    metrics.bytesUploaded = bytesUploaded;
    /**
     * he number of HTTP 4xx client error status code requests made to an Amazon S3 bucket with a
     * value of either 0 or 1. The average statistic shows the error rate, and the sum statistic
     * shows the count of that type of error, during each period.
     *
     * Units: Count
     *
     * Valid statistics: Average (reports per request), Sum (reports per period), Min, Max, Sample
     * Count
     */
    function errors4xx(change) {
        return metric("4xxErrors", Object.assign({ unit: "Count" }, change));
    }
    metrics.errors4xx = errors4xx;
    /**
     * The number of HTTP 5xx server error status code requests made to an Amazon S3 bucket with a
     * value of either 0 or 1. The average statistic shows the error rate, and the sum statistic
     * shows the count of that type of error, during each period.
     *
     * Units: Count
     *
     * Valid statistics: Average (reports per request), Sum (reports per period), Min, Max, Sample
     * Count
     */
    function errors5xx(change) {
        return metric("5xxErrors", Object.assign({ unit: "Count" }, change));
    }
    metrics.errors5xx = errors5xx;
    /**
     * The per-request time from the complete request being received by an Amazon S3 bucket to when
     * the response starts to be returned.
     *
     * Units: Milliseconds
     *
     * Valid statistics: Average, Sum, Min, Max, Sample Count
     */
    function firstByteLatency(change) {
        return metric("FirstByteLatency", Object.assign({ unit: "Milliseconds" }, change));
    }
    metrics.firstByteLatency = firstByteLatency;
    /**
     * The elapsed per-request time from the first byte received to the last byte sent to an Amazon
     * S3 bucket. This includes the time taken to receive the request body and send the response
     * body, which is not included in FirstByteLatency.
     *
     * Units: Milliseconds
     *
     * Valid statistics: Average, Sum, Min, Max, Sample Count
     */
    function totalRequestLatency(change) {
        return metric("TotalRequestLatency", Object.assign({ unit: "Milliseconds" }, change));
    }
    metrics.totalRequestLatency = totalRequestLatency;
})(metrics = exports.metrics || (exports.metrics = {}));
//# sourceMappingURL=metrics.js.map