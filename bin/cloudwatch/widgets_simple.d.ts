import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { MetricStatistic } from "./metric";
import { Widget } from "./widget";
import { WidgetAnnotation } from "./widgets_annotations";
import * as wjson from "./widgets_json";
export interface SimpleWidgetArgs {
    /**
     * The width of the widget in grid units (in a 24-column grid). The default is 6.
     *
     * Valid Values: 1–24
     */
    width?: number;
    /**
     * The height of the widget in grid units. The default is 6.
     *
     * Valid Values: 1–1000
     */
    height?: number;
}
/**
 * Base type of all non-flow Widgets to place in a DashboardGrid.
 */
export declare abstract class SimpleWidget implements Widget {
    private readonly args;
    constructor(args: SimpleWidgetArgs);
    width(): number;
    height(): number;
    /** For internal use only. */
    addWidgetJson(widgetJsons: wjson.WidgetJson[], xOffset: number, yOffset: number, region: pulumi.Output<aws.Region>): void;
}
export interface AlarmWidgetArgs extends SimpleWidgetArgs {
    /** An array of alarm ARNs to include in the widget. The array can have 1-100 ARNs. */
    alarms: pulumi.Input<string>[];
    /**
     * Specifies how to sort the alarms in the widget.
     *
     * Choose default to sort them in alphabetical order by alarm name.
     *
     * Choose stateUpdatedTimestamp to sort them first by alarm state, with alarms in ALARM state first,
     * INSUFFICIENT_DATA alarms next, and OK alarms last. Within each group, the alarms are sorted by when
     * they last changed state, with more recent state changes listed first.
     *
     * Choose timestamp to sort them by the time when the alarms most recently changed state, no matter
     * the current alarm state. The alarm that changed state most recently is listed first.
     *
     * If you omit this field, the alarms are sorted in alphabetical order.
     */
    sortBy?: pulumi.Input<"default" | "stateUpdatedTimestamp" | "timestamp" | undefined>;
    /**
     * Use this field to filter the list of alarms displayed in the widget to only those alarms
     * currently in the specified states. You can specify one or more alarm states in the value
     * for this field. The alarm states that you can specify are ALARM, INSUFFICIENT_DATA, and OK.
     *
     * If you omit this field or specify an empty array, all the alarms specified in alarms are displayed.
     */
    states?: pulumi.Input<("ALARM" | "INSUFFICIENT_DATA" | "OK")[] | undefined>;
    /** The title to be displayed for the alarm widget. */
    title?: pulumi.Input<string>;
}
/**
 * Simple widget that displays an array of cloudwatch alarm status in the dashboard grid.
 */
export declare class AlarmWidget extends SimpleWidget {
    private readonly alarmArgs;
    constructor(args: AlarmWidgetArgs);
    height(): number;
    protected computeType(): wjson.AlarmWidgetJson["type"];
    protected computeProperties(region: pulumi.Output<aws.Region>): wjson.AlarmWidgetJson["properties"];
}
/**
 * Simple [Widget] that can be used for putting space between other widgets in the [Dashboard].
 */
export declare class SpaceWidget implements Widget {
    private readonly _width;
    private readonly _height;
    constructor(width: number, height: number);
    constructor(args: SimpleWidgetArgs);
    width(): number;
    height(): number;
    addWidgetJson(widgetJsons: wjson.WidgetJson[], xOffset: number, yOffset: number): void;
}
export interface TextWidgetArgs extends SimpleWidgetArgs {
    /**
     * The text to be displayed by the widget.
     */
    markdown: pulumi.Input<string>;
}
/**
 * Simple widget that displays a piece of text in the dashboard grid.
 */
export declare class TextWidget extends SimpleWidget {
    private readonly textArgs;
    constructor(markdown: string);
    constructor(args: TextWidgetArgs);
    protected computeType(): wjson.TextWidgetJson["type"];
    protected computeProperties(region: pulumi.Output<aws.Region>): wjson.TextWidgetJson["properties"];
}
export interface MetricWidgetArgs extends SimpleWidgetArgs {
    /**
     * Used to show a graph of a single alarm.  If, instead, you want to place horizontal lines in
     * graphs to show the trigger point of an alarm, then add the alarm to [annotations] instead.
     *
     * At least one of [alarm], [annotations] or [metrics] must be supplied.
     */
    alarm?: pulumi.Input<string> | WidgetAlarm;
    /**
     * A single metric widget can have up to one alarm, and multiple horizontal and vertical
     * annotations.
     *
     * An alarm annotation is required only when metrics is not specified. A horizontal or vertical
     * annotation is not required.
     *
     * Instances of this interface include [aws.cloudwatch.Alarm], [AlarmAnnotation],
     * [HorizontalAnnotation] and [VerticalAnnotation].
     *
     * At least one of [alarm], [annotations] or [metrics] must be supplied.
     */
    annotations?: WidgetAnnotation | WidgetAnnotation[];
    /**
     * Specify a metrics array to include one or more metrics (without alarms), math expressions, or
     * search expressions. One metrics array can include 0–100 metrics and expressions.
     *
     * See [ExpressionWidgetMetric] and [Metric] to create instances that can be added to this
     * array.
     *
     * At least one of [alarm], [annotations] or [metrics] must be supplied.
     */
    metrics?: WidgetMetric | WidgetMetric[];
    /** The title to be displayed for the graph or number. */
    title?: pulumi.Input<string>;
    /**
     * The default period, in seconds, for all metrics in this widget. The period is the length of
     * time represented by one data point on the graph. This default can be overridden within each
     * metric definition. The default is 300.
     */
    period?: pulumi.Input<number>;
    /**
     * The region of the metric.  Defaults to the region of the stack if not specified.
     */
    region?: pulumi.Input<aws.Region>;
    /**
     * The default statistic to be displayed for each metric in the array. This default can be
     * overridden within the definition of each individual metric in the metrics array.
     */
    statistic?: pulumi.Input<MetricStatistic>;
    /**
     * The percentile statistic for the metric associated with the alarm. Specify a value between
     * [0.0] and [100].
     */
    extendedStatistic?: pulumi.Input<number>;
}
export interface WidgetAlarm {
    arn: pulumi.Input<string>;
}
/**
 * Base type for widgets that display data from a set of [Metric]s.  See [LineGraphMetricWidget],
 * [StackedAreaGraphMetricWidget] and [SingleNumberMetricWidget] as concrete [Widget] instances for
 * displaying [Metric]s.
 */
export declare abstract class MetricWidget extends SimpleWidget {
    private readonly metricArgs;
    private readonly annotations;
    private readonly metrics;
    constructor(metricArgs: MetricWidgetArgs);
    protected abstract computeView(): wjson.MetricWidgetPropertiesJson["view"];
    protected abstract computedStacked(): wjson.MetricWidgetPropertiesJson["stacked"];
    protected abstract computeYAxis(): wjson.MetricWidgetPropertiesJson["yAxis"];
    protected computeType: () => pulumi.Input<"metric">;
    protected computeProperties(region: pulumi.Output<aws.Region>): wjson.MetricWidgetJson["properties"];
}
/**
 * Base type for all objects that can be placed in the [metrics] array of [MetricWidgetArgs].
 *
 * See [ExpressionWidgetMetric] and [Metric] to create instances that can be added to
 * [MetricWidgetArgs.metrics].
 */
export interface WidgetMetric {
    /** For internal use only. Only intended to be called by [MetricWidget]. */
    addWidgetJson(metrics: wjson.MetricJson[]): void;
}
/**
 * Used to pass math or search expressions to a [MetricWidget].
 *
 * See https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/using-metric-math.html and
 * https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/using-search-expressions.html for
 * more details.
 */
export declare class ExpressionWidgetMetric implements WidgetMetric {
    private readonly expression;
    private readonly label?;
    private readonly id?;
    /**
     * @param expression The math expression or search expression.
     * @param label The label to display in the graph to represent this time series.
     * @param id The id of this time series. This id can be used as part of a math expression.
     */
    constructor(expression: pulumi.Input<string>, label?: string | Promise<string> | pulumi.OutputInstance<string> | undefined, id?: string | Promise<string> | pulumi.OutputInstance<string> | undefined);
    /** For internal use only. */
    addWidgetJson(metrics: wjson.MetricJson[]): void;
}
