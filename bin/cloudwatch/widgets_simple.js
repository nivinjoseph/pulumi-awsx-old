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
const pulumi = require("@pulumi/pulumi");
const widgets_annotations_1 = require("./widgets_annotations");
const utils = require("../utils");
/**
 * Base type of all non-flow Widgets to place in a DashboardGrid.
 */
class SimpleWidget {
    constructor(args) {
        this.args = args;
        if (args.width !== undefined) {
            if (args.width < 1 || args.width > 24) {
                throw new Error("[args.width] must be between 1 and 24 (inclusive).");
            }
        }
        if (args.height !== undefined) {
            if (args.height < 1 || args.height > 1000) {
                throw new Error("[args.height] must be between 1 and 1000 (inclusive).");
            }
        }
    }
    width() {
        return this.args.width !== undefined ? this.args.width : 6;
    }
    height() {
        return this.args.height !== undefined ? this.args.height : 6;
    }
    /** For internal use only. */
    addWidgetJson(widgetJsons, xOffset, yOffset, region) {
        // Build the structure common to all simple widgets.  Defer to our subclasses for
        // details only they can fill in.
        widgetJsons.push({
            x: xOffset,
            y: yOffset,
            width: this.width(),
            height: this.height(),
            type: this.computeType(),
            properties: this.computeProperties(region),
        });
    }
}
exports.SimpleWidget = SimpleWidget;
/**
 * Simple widget that displays an array of cloudwatch alarm status in the dashboard grid.
 */
class AlarmWidget extends SimpleWidget {
    constructor(args) {
        super(args);
        this.alarmArgs = args;
    }
    height() {
        return this.alarmArgs.height !== undefined ? this.alarmArgs.height : 2;
    }
    computeType() {
        return "alarm";
    }
    computeProperties(region) {
        return {
            alarms: this.alarmArgs.alarms,
            sortBy: this.alarmArgs.sortBy,
            states: this.alarmArgs.states,
            title: this.alarmArgs.title,
        };
    }
}
exports.AlarmWidget = AlarmWidget;
/**
 * Simple [Widget] that can be used for putting space between other widgets in the [Dashboard].
 */
class SpaceWidget {
    constructor(widthOrArgs, height) {
        if (typeof widthOrArgs === "number") {
            this._width = widthOrArgs;
            this._height = height;
        }
        else {
            this._width = widthOrArgs.width !== undefined ? widthOrArgs.width : 6;
            this._height = widthOrArgs.height !== undefined ? widthOrArgs.height : 6;
        }
    }
    width() { return this._width; }
    height() { return this._height; }
    addWidgetJson(widgetJsons, xOffset, yOffset) {
        // Nothing to do.  This Widget exists just to ensure proper placement of other real widgets.
    }
}
exports.SpaceWidget = SpaceWidget;
/**
 * Simple widget that displays a piece of text in the dashboard grid.
 */
class TextWidget extends SimpleWidget {
    constructor(markdownOrArgs) {
        const args = typeof markdownOrArgs === "string" ? { markdown: markdownOrArgs } : markdownOrArgs;
        super(args);
        this.textArgs = args;
    }
    computeType() {
        return "text";
    }
    computeProperties(region) {
        return { markdown: this.textArgs.markdown };
    }
}
exports.TextWidget = TextWidget;
function flattenArray(annotations) {
    return Array.isArray(annotations) ? annotations : annotations ? [annotations] : [];
}
/**
 * Base type for widgets that display data from a set of [Metric]s.  See [LineGraphMetricWidget],
 * [StackedAreaGraphMetricWidget] and [SingleNumberMetricWidget] as concrete [Widget] instances for
 * displaying [Metric]s.
 */
class MetricWidget extends SimpleWidget {
    constructor(metricArgs) {
        super(metricArgs);
        this.metricArgs = metricArgs;
        this.computeType = () => "metric";
        this.annotations = flattenArray(metricArgs.annotations);
        this.metrics = flattenArray(metricArgs.metrics);
        // If they specified an alarm, then make an appropriate annotation that will set
        // properties.alarms.
        const alarm = metricArgs.alarm;
        if (alarm) {
            const alarmArm = pulumi.all([alarm.arn, alarm])
                .apply(([s1, s2]) => s1 || s2);
            this.annotations.push(new widgets_annotations_1.AlarmAnnotation(alarmArm));
        }
        if (this.annotations.length === 0 && this.metrics.length === 0) {
            throw new Error("[args.metrics] must be provided if [args.annotations] is not provided.");
        }
    }
    computeProperties(region) {
        const stat = pulumi.all([this.metricArgs.extendedStatistic, this.metricArgs.statistic])
            .apply(([extendedStatistic, statistic]) => {
            if (statistic !== undefined && extendedStatistic !== undefined) {
                throw new Error("[args.statistic] and [args.extendedStatistic] cannot both be provided.");
            }
            return extendedStatistic !== undefined ? `p${extendedStatistic}` : statistic;
        });
        let annotations;
        if (this.annotations.length > 0) {
            annotations = {};
            for (const annotation of this.annotations) {
                annotation.addWidgetJson(annotations);
            }
        }
        let metrics;
        if (this.metrics.length > 0) {
            metrics = [];
            for (const metric of this.metrics) {
                metric.addWidgetJson(metrics);
            }
        }
        const result = {
            stat,
            metrics,
            annotations,
            title: this.metricArgs.title,
            period: utils.ifUndefined(this.metricArgs.period, 300).apply(p => {
                if (p % 60 !== 0) {
                    throw new Error(`Dashboard metric period must be a multiple of 60: ${p}`);
                }
                return p;
            }),
            region: utils.ifUndefined(this.metricArgs.region, region),
            view: this.computeView(),
            stacked: this.computedStacked(),
            yAxis: this.computeYAxis(),
        };
        return result;
    }
}
exports.MetricWidget = MetricWidget;
/** @internal */
function statisticString(obj) {
    return pulumi.output(obj).apply(obj => {
        if (obj.statistic !== undefined && obj.extendedStatistic !== undefined) {
            throw new Error("[args.statistic] and [args.extendedStatistic] cannot both be provided.");
        }
        return obj.extendedStatistic !== undefined ? `p${obj.extendedStatistic}` : obj.statistic;
    });
}
exports.statisticString = statisticString;
/**
 * Used to pass math or search expressions to a [MetricWidget].
 *
 * See https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/using-metric-math.html and
 * https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/using-search-expressions.html for
 * more details.
 */
class ExpressionWidgetMetric {
    /**
     * @param expression The math expression or search expression.
     * @param label The label to display in the graph to represent this time series.
     * @param id The id of this time series. This id can be used as part of a math expression.
     */
    constructor(expression, label, id) {
        this.expression = expression;
        this.label = label;
        this.id = id;
    }
    /** For internal use only. */
    addWidgetJson(metrics) {
        const json = [{
                expression: this.expression,
                label: this.label,
                id: this.id,
            }];
        metrics.push(json);
    }
}
exports.ExpressionWidgetMetric = ExpressionWidgetMetric;
//# sourceMappingURL=widgets_simple.js.map