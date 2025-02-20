import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as mod from ".";
import * as x from "..";
export interface ListenerEndpoint {
    hostname: string;
    port: number;
}
export declare abstract class Listener extends pulumi.ComponentResource implements x.ecs.ContainerPortMappingProvider, x.ecs.ContainerLoadBalancerProvider {
    readonly listener: aws.lb.Listener;
    readonly loadBalancer: x.lb.LoadBalancer;
    readonly defaultTargetGroup?: x.lb.TargetGroup;
    readonly endpoint: pulumi.Output<ListenerEndpoint>;
    private readonly defaultListenerAction?;
    private readonly __isListenerInstance;
    constructor(type: string, name: string, defaultListenerAction: ListenerDefaultAction | undefined, args: ListenerArgs, opts: pulumi.ComponentResourceOptions);
    containerPortMapping(name: string, parent: pulumi.Resource): pulumi.Input<aws.ecs.PortMapping>;
    containerLoadBalancer(name: string, parent: pulumi.Resource): pulumi.Input<x.ecs.ContainerLoadBalancer>;
    addListenerRule(name: string, args: x.lb.ListenerRuleArgs, opts?: pulumi.ComponentResourceOptions): mod.ListenerRule;
    /**
     * Attaches a target to the `defaultTargetGroup` for this Listener.
     */
    attachTarget(name: string, args: mod.LoadBalancerTarget, opts?: pulumi.CustomResourceOptions): mod.TargetGroupAttachment;
}
/**
 * See https://www.terraform.io/docs/providers/aws/r/lb_listener.html#default_action
 */
export interface ListenerDefaultActionArgs {
    authenticateCognito?: pulumi.Input<{
        /**
         * The query parameters to include in the redirect request to the authorization endpoint.
         * Max: 10.
         */
        authenticationRequestExtraParams?: pulumi.Input<{
            [key: string]: any;
        }>;
        /**
         * The behavior if the user is not authenticated. Valid values: deny, allow and
         * authenticate.
         */
        onUnauthenticatedRequest?: pulumi.Input<string>;
        /**
         * The set of user claims to be requested from the IdP.
         */
        scope?: pulumi.Input<string>;
        /**
         * The name of the cookie used to maintain session information.
         */
        sessionCookieName?: pulumi.Input<string>;
        /**
         * The maximum duration of the authentication session, in seconds.
         */
        sessionTimeout?: pulumi.Input<number>;
        /**
         * The ARN of the Cognito user pool.
         */
        userPoolArn: pulumi.Input<string>;
        /**
         * The ID of the Cognito user pool client.
         */
        userPoolClientId: pulumi.Input<string>;
        /**
         * The domain prefix or fully-qualified domain name of the Cognito user pool.
         */
        userPoolDomain: pulumi.Input<string>;
    }>;
    authenticateOidc?: pulumi.Input<{
        /**
         * The query parameters to include in the redirect request to the authorization endpoint.
         * Max: 10.
         */
        authenticationRequestExtraParams?: pulumi.Input<{
            [key: string]: any;
        }>;
        /**
         *  The authorization endpoint of the IdP.
         */
        authorizationEndpoint: pulumi.Input<string>;
        /**
         * The OAuth 2.0 client identifier.
         */
        clientId: pulumi.Input<string>;
        /**
         * The OAuth 2.0 client secret.
         */
        clientSecret: pulumi.Input<string>;
        /**
         * The OIDC issuer identifier of the IdP.
         */
        issuer: pulumi.Input<string>;
        /**
         * The behavior if the user is not authenticated. Valid values: deny, allow and authenticate
         */
        onUnauthenticatedRequest?: pulumi.Input<string>;
        /**
         * The set of user claims to be requested from the IdP.
         */
        scope?: pulumi.Input<string>;
        /**
         * The name of the cookie used to maintain session information.
         */
        sessionCookieName?: pulumi.Input<string>;
        /**
         * The maximum duration of the authentication session, in seconds.
         */
        sessionTimeout?: pulumi.Input<number>;
        /**
         * The token endpoint of the IdP.
         */
        tokenEndpoint: pulumi.Input<string>;
        /**
         * The user info endpoint of the IdP.
         */
        userInfoEndpoint: pulumi.Input<string>;
    }>;
    /**
     * Information for creating an action that returns a custom HTTP response. Required if type is
     * "fixed-response".
     */
    fixedResponse?: pulumi.Input<{
        /**
         * The content type. Valid values are text/plain, text/css, text/html,
         * application/javascript and application/json.
         */
        contentType: pulumi.Input<string>;
        messageBody?: pulumi.Input<string>;
        /**
         * The HTTP response code. Valid values are 2XX, 4XX, or 5XX.
         */
        statusCode?: pulumi.Input<string>;
    }>;
    order?: pulumi.Input<number>;
    /**
     * Information for creating a redirect action. Required if type is "redirect".
     */
    redirect?: pulumi.Input<{
        /**
         * The hostname. This component is not percent-encoded. The hostname can contain #{host}.
         * Defaults to #{host}.
         */
        host?: pulumi.Input<string>;
        /**
         * The absolute path, starting with the leading "/". This component is not percent-encoded.
         * The path can contain #{host}, #{path}, and #{port}. Defaults to /#{path}.
         */
        path?: pulumi.Input<string>;
        /**
         * The port. Specify a value from 1 to 65535 or #{port}. Defaults to #{port}.
         */
        port?: pulumi.Input<string>;
        /**
         * The protocol. Valid values are HTTP, HTTPS, or #{protocol}. Defaults to #{protocol}.
         */
        protocol?: pulumi.Input<string>;
        /**
         * The query parameters, URL-encoded when necessary, but not percent-encoded. Do not include
         * the leading "?".
         */
        query?: pulumi.Input<string>;
        /**
         * The HTTP redirect code. The redirect is either permanent (HTTP_301) or temporary
         * (HTTP_302).
         */
        statusCode: pulumi.Input<string>;
    }>;
    /**
     * The ARN of the Target Group to which to route traffic. Required if type is "forward".
     */
    targetGroupArn?: pulumi.Input<string>;
    /**
     * The type of routing action. Valid values are "forward", "redirect", "fixed-response",
     * "authenticate-cognito" and "authenticate-oidc".
     */
    type: pulumi.Input<string>;
}
export interface ListenerDefaultAction {
    listenerDefaultAction(): pulumi.Input<ListenerDefaultActionArgs>;
    registerListener(listener: Listener): void;
}
export interface ListenerActions {
    actions(): aws.lb.ListenerRuleArgs["actions"];
    registerListener(listener: Listener): void;
}
export interface ListenerArgs {
    /**
     * An existing aws.lb.Listener to use for this awsx.lb.Listener.
     * If not provided, one will be created.
     */
    listener?: aws.lb.Listener;
    loadBalancer: x.lb.LoadBalancer;
    /**
     * The ARN of the default SSL server certificate. Exactly one certificate is required if the
     * protocol is HTTPS. For adding additional SSL certificates, see the
     * [`aws_lb_listener_certificate`
     * resource](https://www.terraform.io/docs/providers/aws/r/lb_listener_certificate.html).
     */
    certificateArn?: pulumi.Input<string>;
    /**
     * An list of Action blocks. See [ListenerDefaultActionArgs] for more information.
     */
    defaultActions: pulumi.Input<pulumi.Input<ListenerDefaultActionArgs>[]>;
    /**
     * The port. Specify a value from `1` to `65535`.
     */
    port: pulumi.Input<number>;
    /**
     * The protocol.
     */
    protocol: pulumi.Input<"HTTP" | "HTTPS" | "TCP" | "TLS" | "GENEVE" | "UDP" | "TCP_UDP">;
    /**
     * The name of the SSL Policy for the listener. Required if `protocol` is `HTTPS`.
     */
    sslPolicy?: pulumi.Input<string>;
}
