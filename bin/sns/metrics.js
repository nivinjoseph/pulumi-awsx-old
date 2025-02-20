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
     * Creates an AWS/SNS metric with the requested [metricName]. See
     * https://docs.aws.amazon.com/sns/latest/dg/sns-monitoring-using-cloudwatch.html for list of
     * all metric-names.
     *
     * Note, individual metrics can easily be obtained without supplying the name using the other
     * [metricXXX] functions.
     *
     * Amazon SNS and CloudWatch are integrated so you can collect, view, and analyze metrics for
     * every active Amazon SNS notification. Once you have configured CloudWatch for Amazon SNS, you
     * can gain better insight into the performance of your Amazon SNS topics, push notifications,
     * and SMS deliveries. For example, you can set an alarm to send you an email notification if a
     * specified threshold is met for an Amazon SNS metric, such as NumberOfNotificationsFailed.
     *
     * The metrics you configure with CloudWatch for your Amazon SNS topics are automatically
     * collected and pushed to CloudWatch every five minutes. These metrics are gathered on all
     * topics that meet the CloudWatch guidelines for being active. A topic is considered active by
     * CloudWatch for up to six hours from the last activity (i.e., any API call) on the topic.
     *
     * Amazon Simple Notification Service sends the following dimensions to CloudWatch:
     *
     * 1. "Application": Filters on application objects, which represent an app and device
     *    registered with one of the supported push notification services, such as APNS and FCM.
     * 2. "Application,Platform": Filters on application and platform objects, where the platform
     *    objects are for the supported push notification services, such as APNS and FCM.
     * 3. "Country": Filters on the destination country or region of an SMS message. The country or
     *    region is represented by its ISO 3166-1 alpha-2 code.
     * 4. "Platform": Filters on platform objects for the push notification services, such as APNS
     *    and FCM.
     * 5. "TopicName": Filters on Amazon SNS topic names.
     * 6. "SMSType": Filters on the message type of SMS message. Can be "promotional" or
     *    "transactional".
     */
    function metric(metricName, change = {}) {
        const dimensions = {};
        if (change.topic !== undefined) {
            dimensions.TopicName = change.topic.name;
        }
        if (change.application !== undefined) {
            dimensions.Application = change.application;
        }
        if (change.country !== undefined) {
            dimensions.Country = change.country;
        }
        if (change.platform !== undefined) {
            dimensions.Platform = change.platform;
        }
        if (change.smsType !== undefined) {
            dimensions.SMSType = change.smsType;
        }
        return new cloudwatch.Metric(Object.assign({ namespace: "AWS/SNS", name: metricName }, change)).withDimensions(dimensions);
    }
    /**
     * The number of messages published to your Amazon SNS topics.
     *
     * Units: Count
     *
     * Valid Statistics: Sum
     */
    function numberOfMessagesPublished(change) {
        return metric("NumberOfMessagesPublished", Object.assign({ statistic: "Sum", unit: "Count" }, change));
    }
    metrics.numberOfMessagesPublished = numberOfMessagesPublished;
    /**
     * The number of messages successfully delivered from your Amazon SNS topics to subscribing
     * endpoints.
     *
     * For a delivery attempt to succeed, the endpoint's subscription must accept the message. A
     * subscription accepts a message if a.) it lacks a filter policy or b.) its filter policy
     * includes attributes that match those assigned to the message. If the subscription rejects the
     * message, the delivery attempt isn't counted for this metric.
     *
     * Units: Count
     *
     * Valid Statistics: Sum
     */
    function numberOfNotificationsDelivered(change) {
        return metric("NumberOfNotificationsDelivered", Object.assign({ statistic: "Sum", unit: "Count" }, change));
    }
    metrics.numberOfNotificationsDelivered = numberOfNotificationsDelivered;
    /**
     * The number of messages that Amazon SNS failed to deliver.
     *
     * For Amazon SQS, email, SMS, or mobile push endpoints, the metric increments by 1 when Amazon
     * SNS stops attempting message deliveries. For HTTP or HTTPS endpoints, the metric includes
     * every failed delivery attempt, including retries that follow the initial attempt. For all
     * other endpoints, the count increases by 1 when the message fails to deliver (regardless of
     * the number of attempts).
     *
     * This metric does not include messages that were rejected by subscription filter policies.
     *
     * Units: Count
     *
     * Valid Statistics: Sum, Average
     */
    function numberOfNotificationsFailed(change) {
        return metric("NumberOfNotificationsFailed", Object.assign({ unit: "Count" }, change));
    }
    metrics.numberOfNotificationsFailed = numberOfNotificationsFailed;
    /**
     * The number of messages that were rejected by subscription filter policies because the
     * messages have no attributes.
     *
     * Units: Count
     *
     * Valid Statistics: Sum, Average
     */
    function numberOfNotificationsFilteredOut_NoMessageAttributes(change) {
        return metric("NumberOfNotificationsFilteredOut-NoMessageAttributes", Object.assign({ unit: "Count" }, change));
    }
    metrics.numberOfNotificationsFilteredOut_NoMessageAttributes = numberOfNotificationsFilteredOut_NoMessageAttributes;
    /**
     * The number of messages that were rejected by subscription filter policies because the
     * messages' attributes are invalid – for example, because the attribute JSON is incorrectly
     * formatted.
     *
     * Units: Count
     *
     * Valid Statistics: Sum, Average
     */
    function numberOfNotificationsFilteredOut_InvalidAttributes(change) {
        return metric("NumberOfNotificationsFilteredOut-InvalidAttributes", Object.assign({ unit: "Count" }, change));
    }
    metrics.numberOfNotificationsFilteredOut_InvalidAttributes = numberOfNotificationsFilteredOut_InvalidAttributes;
    /**
     * The number of database connections in use.
     *
     * Units: Bytes
     *
     * Valid Statistics: Minimum, Maximum, Average and Count
     */
    function publishSize(change) {
        return metric("PublishSize", Object.assign({ unit: "Bytes" }, change));
    }
    metrics.publishSize = publishSize;
    /**
     * The charges you have accrued since the start of the current calendar month for sending SMS
     * messages.
     *
     * You can set an alarm for this metric to know when your month-to-date charges are close to the
     * monthly SMS spend limit for your account. When Amazon SNS determines that sending an SMS
     * message would incur a cost that exceeds this limit, it stops publishing SMS messages within
     * minutes.
     *
     * Valid Statistics: Maximum
     */
    function smsMonthToDateSpentUSD(change) {
        return metric("SMSMonthToDateSpentUSD", Object.assign({ statistic: "Maximum" }, change));
    }
    metrics.smsMonthToDateSpentUSD = smsMonthToDateSpentUSD;
    /**
     * The rate of successful SMS message deliveries.
     *
     * Units: Count
     *
     * Valid Statistics: Sum, Average, Data Samples
     */
    function smsSuccessRate(change) {
        return metric("SMSSuccessRate", Object.assign({ unit: "Count" }, change));
    }
    metrics.smsSuccessRate = smsSuccessRate;
})(metrics = exports.metrics || (exports.metrics = {}));
//# sourceMappingURL=metrics.js.map