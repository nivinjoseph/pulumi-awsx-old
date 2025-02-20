import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as awslambda from "aws-lambda";
import * as cognitoAuthorizer from "./cognitoAuthorizer";
import * as lambdaAuthorizer from "./lambdaAuthorizer";
import * as reqvalidation from "./requestValidator";
import { APIKeySource, IntegrationConnectionType, IntegrationPassthroughBehavior, IntegrationType, Method, RequestValidator, SwaggerGatewayResponse } from "./swagger_json";
export declare type Request = awslambda.APIGatewayProxyEvent;
export declare type RequestContext = awslambda.APIGatewayEventRequestContext;
export declare type Response = awslambda.APIGatewayProxyResult;
/**
 * A route that that APIGateway should accept and forward to some type of destination. All routes
 * have an incoming path that they match against.  However, destinations are determined by the kind
 * of the route.  See [EventHandlerRoute], [StaticRoute], [IntegrationRoute] and [RawJsonRoute] for
 * additional details.
 */
export declare type Route = EventHandlerRoute | StaticRoute | IntegrationRoute | RawDataRoute;
/**
 * Subset of `Route` types that can be passed in as an `Output` to the API.  These Route types will
 * not themselves cause other Resources to be created.
 *
 * Unlike `routes`, these can be provided as an `Output` of an `array` instead of having to just be
 * an `array`. However, because they can be `Output`s, they are restricted to a subset of `Route`
 * types that will not cause resources to be created.
 *
 * This can be useful, for example, when creating an API that needs to create an indeterminate
 * number of integration-routes based on the `Output` of some other resource.  For example:
 *
 * ```ts
 * const additionalRoutes = elasticBeanstalkEnvironment.loadBalancers.apply(lbs =>
 *   lbs.map(arn => <awsx.apigateway.IntegrationRoute>{
 *     path: "/greeting",
 *     method: "GET",
 *     target: {
 *         type: "http_proxy",
 *         uri: `http://${aws.lb.getLoadBalancer({ arn }).dnsName}`,
 *     }
 *   }));
 *
 * const api = new awsx.apigateway.API("apiName", { additionalRoutes });
 * ```
 *
 * In this example computing all of the individual `additionalRoutes` depends on the individual
 * array values in `elasticBeanstalkEnvironment.loadBalancers` (which is itself an `Output`).  These
 * could not normally be converted into the reified `Route[]` array since computing a value off of
 * an `Output` produces yet another `Output`.  `routes` itself cannot be an `Output` because it will
 * often create additional AWS resources, and creating those resources dependent on some other
 * resource value would mean not being able to create and present a preview plan because the actual
 * resources created would depend on previous resources.
 *
 * So `additionalRoutes` serves as a way to bridge both approaches.  `Routes` is used when the
 * values are known up-front (or when it would cause Resources to be created).  `additionalRoutes`
 * is used when values are not a-priori known, and when they will not create additional Resources
 * themselves.
 */
export declare type AdditionalRoute = IntegrationRoute | RawDataRoute;
export interface BaseRoute {
    /**
     * Required Parameters to validate. If the request validator is set to ALL or PARAMS_ONLY, api
     * gateway will validate these before sending traffic to the event handler.
     */
    requiredParameters?: reqvalidation.Parameter[];
    /**
    * Request Validator specifies the validator to use at the method level. This will override anything
    * defined at the API level.
    */
    requestValidator?: RequestValidator;
    /**
     * If true, an API key will be required for this route. The source for the API Key can be set at
     * the API level and by default, the source will be the HEADER.
     */
    apiKeyRequired?: boolean;
    /**
     * Authorizers allows you to define Lambda authorizers be applied for authorization when the
     * the route is called.
     */
    authorizers?: Authorizer[] | Authorizer;
    /**
     * By default, the route method auth type is set to `NONE`. If true, the auth type will be
     * set to `AWS_IAM`.
     */
    iamAuthEnabled?: boolean;
}
export interface EventHandlerRoute extends BaseRoute {
    /**
     * The path on the API that will invoke the provided [eventHandler].  If not prefixed with `/`,
     * then a `/` will be added automatically to the beginning.
     */
    path: string;
    method: Method;
    eventHandler: aws.lambda.EventHandler<Request, Response>;
}
declare type Authorizer = lambdaAuthorizer.LambdaAuthorizer | cognitoAuthorizer.CognitoAuthorizer;
/**
 * StaticRoute is a route that will map from an incoming path to the files/directories specified by
 * [localPath].
 */
export interface StaticRoute extends BaseRoute {
    /**
     * The path on the API that will map to files in [localPath].  If not prefixed with `/`, then a
     * `/` will be added automatically to the beginning.
     */
    path: string;
    /**
     * The local path on disk to create static S3 resources for.  Files will be uploaded into S3
     * objects, and directories will be recursively walked into.
     */
    localPath: string;
    /**
     * The `content-type` to serve the file as.  Only valid when localPath points to a file.  If
     * localPath points to a directory, the content types for all files will be inferred.
     */
    contentType?: string;
    /**
     * By default API.static will also serve 'index.html' in response to a request on a directory.
     * To disable this set false or to supply a new index pass an appropriate name.
     */
    index?: boolean | string;
}
/**
 * An apigateway route for an integration.
 * https://docs.aws.amazon.com/apigateway/api-reference/resource/integration/ for more details.
 */
export interface IntegrationRoute extends BaseRoute {
    /**
     * The path on the API that will invoke the provided [target].  If not prefixed with `/`, then a
     * `/` will be added automatically to the beginning.
     */
    path: string;
    target: pulumi.Input<IntegrationTarget> | IntegrationRouteTargetProvider;
}
/**
 * See https://docs.aws.amazon.com/apigateway/api-reference/resource/integration/ for more details.
 */
export interface IntegrationTarget {
    /**
     * Specifies an API method integration type. The valid value is one of the following:
     *
     * aws: for integrating the API method request with an AWS service action, including the Lambda
     * function-invoking action. With the Lambda function-invoking action, this is referred to as
     * the Lambda custom integration. With any other AWS service action, this is known as AWS
     * integration.
     *
     * aws_proxy: for integrating the API method request with the Lambda function-invoking action
     * with the client request passed through as-is. This integration is also referred to as the
     * Lambda proxy integration.
     *
     * http: for integrating the API method request with an HTTP endpoint, including a private HTTP
     * endpoint within a VPC. This integration is also referred to as the HTTP custom integration.
     *
     * http_proxy: for integrating the API method request with an HTTP endpoint, including a private
     * HTTP endpoint within a VPC, with the client request passed through as-is. This is also
     * referred to as the HTTP proxy integration.
     *
     * mock: for integrating the API method request with API Gateway as a "loop-back" endpoint
     * without invoking any backend.
     */
    type: pulumi.Input<IntegrationType>;
    /**
     * Specifies the integration's HTTP method type.  Currently, the only supported type is 'ANY'.
     */
    httpMethod?: "ANY";
    /**
     * Specifies Uniform Resource Identifier (URI) of the integration endpoint.
     *
     * For HTTP or HTTP_PROXY integrations, the URI must be a fully formed, encoded HTTP(S) URL
     * according to the RFC-3986 specification, for either standard integration, where
     * connectionType is not VPC_LINK, or private integration, where connectionType is VPC_LINK. For
     * a private HTTP integration, the URI is not used for routing.
     *
     * For AWS or AWS_PROXY integrations, the URI is of the form
     * arn:aws:apigateway:{region}:{subdomain.service|service}:path|action/{service_api}. Here,
     * {Region} is the API Gateway region (e.g., us-east-1); {service} is the name of the integrated
     * AWS service (e.g., s3); and {subdomain} is a designated subdomain supported by certain AWS
     * service for fast host-name lookup. action can be used for an AWS service action-based API,
     * using an Action={name}&{p1}={v1}&p2={v2}... query string. The ensuing {service_api} refers to
     * a supported action {name} plus any required input parameters. Alternatively, path can be used
     * for an AWS service path-based API. The ensuing service_api refers to the path to an AWS
     * service resource, including the region of the integrated AWS service, if applicable. For
     * example, for integration with the S3 API of GetObject, the uri can be either
     * arn:aws:apigateway:us-west-2:s3:action/GetObject&Bucket={bucket}&Key={key} or
     * arn:aws:apigateway:us-west-2:s3:path/{bucket}/{key}
     */
    uri: pulumi.Input<string>;
    /**
     * The type of the network connection to the integration endpoint. The valid value is INTERNET
     * for connections through the public routable internet or VPC_LINK for private connections
     * between API Gateway and a network load balancer in a VPC. The default value is INTERNET.
     */
    connectionType?: pulumi.Input<IntegrationConnectionType>;
    /**
     * The (id) of the VpcLink used for the integration when connectionType=VPC_LINK and undefined,
     * otherwise.
     */
    connectionId?: pulumi.Input<string>;
    /**
     * Specifies how the method request body of an unmapped content type will be passed through the
     * integration request to the back end without transformation.
     *
     * The valid value is one of the following:
     *
     * WHEN_NO_MATCH: passes the method request body through the integration request to the back end
     * without transformation when the method request content type does not match any content type
     * associated with the mapping templates defined in the integration request.
     *
     * WHEN_NO_TEMPLATES: passes the method request body through the integration request to the back
     * end without transformation when no mapping template is defined in the integration request. If
     * a template is defined when this option is selected, the method request of an unmapped
     * content-type will be rejected with an HTTP 415 Unsupported Media Type response.
     *
     * NEVER: rejects the method request with an HTTP 415 Unsupported Media Type response when
     * either the method request content type does not match any content type associated with the
     * mapping templates defined in the integration request or no mapping template is defined in the
     * integration request.
     *
     * Defaults to 'WHEN_NO_MATCH' if unspecified.
     */
    passthroughBehavior?: pulumi.Input<IntegrationPassthroughBehavior>;
}
export interface IntegrationRouteTargetProvider {
    target(name: string, parent: pulumi.Resource): pulumi.Input<IntegrationTarget>;
}
/**
 * Fallback route for when raw swagger control is desired.  The [data] field should be a javascript
 * object that will be then included in the final swagger specification like so:
 *
 * `"paths": { [path]: { [method]: data } }`
 *
 * This value will be JSON.stringify'd as part of normal processing.  It should not be passed as
 * string here.
 */
export declare type RawDataRoute = {
    /**
     * The path on the API that will return the provided [data].  If not prefixed with `/`, then a
     * `/` will be added automatically to the beginning.
     */
    path: string;
    method: Method;
    data: any;
};
export interface Endpoint {
    hostname: string;
    port: number;
    loadBalancer: aws.lb.LoadBalancer;
}
export interface APIArgs {
    /**
     * Routes to use to initialize the APIGateway.  These will be used to create the Swagger
     * specification for the API.
     *
     * Either [swaggerString] or [routes] or [additionalRoutes] must be specified.  [routes] can be
     * provided along with [additionalRoutes].
     */
    routes?: Route[];
    /**
     * Routes to use to initialize the APIGateway.  These will be used to create the Swagger
     * specification for the API.
     *
     * Either [swaggerString] or [routes] or [additionalRoutes] must be specified.  [routes] can be
     * provided along with [additionalRoutes].
     */
    additionalRoutes?: pulumi.Input<pulumi.Input<AdditionalRoute>[]>;
    /**
     * A Swagger specification already in string form to use to initialize the APIGateway.  Note
     * that you must manually provide permission for any route targets to be invoked by API Gateway
     * when using [swaggerString].
     *
     * Either [swaggerString] or [routes] must be specified.
     */
    swaggerString?: pulumi.Input<string>;
    /**
     * The stage name for your API. This will get added as a base path to your API url.
     */
    stageName?: pulumi.Input<string>;
    /**
    * Request Validator specifies the validator to use at the API level. Note method level validators
    * override this.
    */
    requestValidator?: RequestValidator;
    /**
     * The source for the apikey. This can either be a HEADER or AUTHORIZER. If [apiKeyRequired] is
     * set to true on a route, and this is not defined the value will default to HEADER.
     */
    apiKeySource?: APIKeySource;
    /**
     * Bucket to use for placing resources for static resources.  If not provided a default one will
     * be created on your behalf if any [StaticRoute]s are provided.
     */
    staticRoutesBucket?: aws.s3.Bucket | aws.s3.BucketArgs;
    /**
     * Define custom gateway responses for the API. This can be used to properly enable
     * CORS for Lambda Authorizers.
     */
    gatewayResponses?: Record<string, SwaggerGatewayResponse>;
    /**
     * Additional optional args that can be passed along to the aws.apigateway.RestApi created by the
     * awsx.apigateway.API.
     */
    restApiArgs?: RestApiArgs;
    /**
     * Additional optional args that can be passed along to the aws.apigateway.Stage created by the
     * awsx.apigateway.API.
     */
    stageArgs?: StageArgs;
    /**
     * Additional optional args that can be passed along to the aws.apigateway.Deployment created by
     * the awsx.apigateway.API.
     */
    deploymentArgs?: DeploymentArgs;
}
/**
 * Additional optional args that can be passed along to the RestApi created by the
 * awsx.apigateway.API.
 */
export declare type RestApiArgs = aws.apigateway.RestApiArgs;
/**
 * Additional optional args that can be passed along to the Stage created by the
 * awsx.apigateway.API.
 */
export interface StageArgs {
    /**
     * Enables access logs for the API stage. Detailed below.
     */
    accessLogSettings?: pulumi.Input<aws.types.input.apigateway.StageAccessLogSettings>;
    /**
     * Specifies whether a cache cluster is enabled for the stage
     */
    cacheClusterEnabled?: pulumi.Input<boolean>;
    /**
     * The size of the cache cluster for the stage, if enabled.
     * Allowed values include `0.5`, `1.6`, `6.1`, `13.5`, `28.4`, `58.2`, `118` and `237`.
     */
    cacheClusterSize?: pulumi.Input<string>;
    /**
     * The identifier of a client certificate for the stage.
     */
    clientCertificateId?: pulumi.Input<string>;
    /**
     * The description of the stage
     */
    description?: pulumi.Input<string>;
    /**
     * The version of the associated API documentation
     */
    documentationVersion?: pulumi.Input<string>;
    /**
     * A mapping of tags to assign to the resource.
     */
    tags?: pulumi.Input<{
        [key: string]: any;
    }>;
    /**
     * A map that defines the stage variables
     */
    variables?: pulumi.Input<{
        [key: string]: any;
    }>;
    /**
     * Whether active tracing with X-ray is enabled. Defaults to `false`.
     */
    xrayTracingEnabled?: pulumi.Input<boolean>;
}
/**
 * Additional optional args that can be passed along to the Deployment created by the
 * awsx.apigateway.API.
 */
export interface DeploymentArgs {
    /**
     * The description of the deployment
     */
    description?: pulumi.Input<string>;
    /**
     * The description of the stage
     */
    stageDescription?: pulumi.Input<string>;
}
export declare class API extends pulumi.ComponentResource {
    readonly restAPI: aws.apigateway.RestApi;
    readonly deployment: aws.apigateway.Deployment;
    readonly stage: aws.apigateway.Stage;
    readonly apiPolicy?: aws.apigateway.RestApiPolicy;
    /**
     * Bucket where static resources were placed.  Only set if a Bucket was provided to the API at
     * construction time, or if there were any [StaticRoute]s passed to the API.
     */
    readonly staticRoutesBucket?: aws.s3.Bucket;
    readonly url: pulumi.Output<string>;
    private readonly swaggerLambdas;
    constructor(name: string, args: APIArgs, opts?: pulumi.ComponentResourceOptions);
    /**
     * Returns the [aws.lambda.Function] an [EventHandlerRoute] points to.  This will either be for
     * the aws.lambda.Function created on your behalf if the route was passed a normal
     * JavaScript/Typescript function, or it will be the [aws.lambda.Function] that was explicitly
     * passed in.
     *
     * [route] and [method] can both be elided if this API only has a single [EventHandlerRoute]
     * assigned to it.
     *
     * [method] can be elided if [route] only has a single [EventHandlerRoute] assigned to it.
     *
     * This method will throw if the provided [route] and [method] do not resolve to a single
     * [aws.lambda.Function]
     */
    getFunction(route?: string, method?: Method): aws.lambda.Function;
    private getMethods;
}
interface APIResources {
    restAPI: aws.apigateway.RestApi;
    deployment: aws.apigateway.Deployment;
    stage: aws.apigateway.Stage;
    apiPolicy?: aws.apigateway.RestApiPolicy;
    staticRoutesBucket?: aws.s3.Bucket;
    url: pulumi.Output<string>;
    swaggerLambdas: SwaggerLambdas;
}
export declare function createAPI(parent: pulumi.Resource, name: string, args: APIArgs, optsParent?: pulumi.Resource): APIResources;
declare type SwaggerLambdas = Map<string, Map<Method, aws.lambda.Function>>;
export {};
