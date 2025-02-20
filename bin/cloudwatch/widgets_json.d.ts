import * as pulumi from "@pulumi/pulumi";
import { YAxis } from "./widgets_graph";
export interface WidgetJson {
    type: pulumi.Input<"alarm" | "metric" | "text">;
    x: pulumi.Input<number>;
    y: pulumi.Input<number>;
    width: pulumi.Input<number>;
    height: pulumi.Input<number>;
    properties: Record<string, any>;
}
export interface AlarmWidgetJson extends WidgetJson {
    type: pulumi.Input<"alarm">;
    properties: pulumi.Input<AlarmWidgetPropertiesJson>;
}
export interface AlarmWidgetPropertiesJson {
    alarms: pulumi.Input<pulumi.Input<string>[]>;
    sortBy: pulumi.Input<"default" | "stateUpdatedTimestamp" | "timestamp" | undefined>;
    states: pulumi.Input<("ALARM" | "INSUFFICIENT_DATA" | "OK")[] | undefined>;
    title: pulumi.Input<string | undefined>;
}
export interface TextWidgetJson extends WidgetJson {
    type: pulumi.Input<"text">;
    properties: pulumi.Input<{
        markdown: pulumi.Input<string>;
    }>;
}
export interface MetricWidgetJson extends WidgetJson {
    type: pulumi.Input<"metric">;
    properties: pulumi.Input<MetricWidgetPropertiesJson>;
}
export interface MetricWidgetPropertiesJson {
    metrics: MetricJson[] | undefined;
    annotations: MetricWidgetAnnotationsJson | undefined;
    title: pulumi.Input<string> | undefined;
    period: pulumi.Input<number> | undefined;
    region: pulumi.Input<string | undefined>;
    stat: pulumi.Input<string>;
    view: pulumi.Input<"timeSeries" | "singleValue" | undefined>;
    stacked: pulumi.Input<boolean | undefined>;
    yAxis: pulumi.Input<YAxis> | undefined;
}
export interface MetricWidgetAnnotationsJson {
    alarms?: pulumi.Input<string>[];
    horizontal?: BaseHorizontalAnnotationJson[];
    vertical?: BaseVerticalAnnotationJson[];
}
export declare type MetricJson = SingleMetricJson | ExpressionMetricJson;
export declare type ExpressionMetricJson = [{
    expression: pulumi.Input<string>;
    label: pulumi.Input<string | undefined>;
    id: pulumi.Input<string | undefined>;
}];
export declare type SingleMetricJson = pulumi.Output<(string | RenderingPropertiesJson)[]>;
export interface RenderingPropertiesJson {
    color: string | undefined;
    label: string | undefined;
    period: number | undefined;
    stat: string | undefined;
    visible: boolean | undefined;
    yAxis: "right" | "left" | undefined;
}
export interface BaseHorizontalAnnotationJson {
    value: pulumi.Input<number>;
    label: pulumi.Input<string | undefined>;
}
export interface HorizontalAnnotationJson extends BaseHorizontalAnnotationJson {
    color: string | undefined;
    fill: "above" | "below" | undefined;
    visible: boolean | undefined;
    yAxis: "right" | "left" | undefined;
}
interface BaseVerticalAnnotationJson {
    value: pulumi.Input<string>;
    label: pulumi.Input<string | undefined>;
}
export interface VerticalAnnotationJson extends BaseVerticalAnnotationJson {
    color: string | undefined;
    fill: "before" | "after" | undefined;
    visible: boolean | undefined;
}
export {};
