import * as pulumi from "@pulumi/pulumi";
export interface SwaggerSpec {
    swagger: string;
    info: SwaggerInfo;
    paths: {
        [path: string]: {
            [method: string]: SwaggerOperation;
        };
    };
    "x-amazon-apigateway-binary-media-types"?: string[];
    "x-amazon-apigateway-gateway-responses": Record<string, SwaggerGatewayResponse>;
    securityDefinitions?: {
        [securityDefinitionName: string]: SecurityDefinition;
    };
    "x-amazon-apigateway-request-validators"?: {
        [validatorName: string]: {
            validateRequestBody: boolean;
            validateRequestParameters: boolean;
        };
    };
    "x-amazon-apigateway-request-validator"?: RequestValidator;
    "x-amazon-apigateway-api-key-source"?: APIKeySource;
}
export interface SwaggerGatewayResponse {
    statusCode: number;
    responseTemplates: {
        "application/json": string;
    };
    responseParameters?: {
        [parameter: string]: string;
    };
}
export interface SwaggerInfo {
    title: string;
    version: string;
}
export interface SwaggerOperation {
    parameters?: SwaggerParameter[];
    responses?: {
        [code: string]: SwaggerResponse;
    };
    "x-amazon-apigateway-integration": ApigatewayIntegration;
    "x-amazon-apigateway-request-validator"?: RequestValidator;
    "x-amazon-apigateway-auth"?: ApigatewayAuth;
    /**
     * security a list of objects whose keys are the names of the authorizer. Each authorizer name
     * refers to a SecurityDefinition, defined at the top level of the swagger definition, by
     * matching a Security Definition's name property. For Cognito User Pool Authorizers, the value
     * of these object can be left as an empty array or used to define the resource servers and
     * custom scopes (e.g. "resource-server/scope"). For lambda authorizers, the value of the
     * objects is an empty array.
     */
    security?: Record<string, string[]>[];
}
export interface SecurityDefinition {
    type: "apiKey";
    name: string;
    in: "header" | "query";
    "x-amazon-apigateway-authtype"?: string;
    "x-amazon-apigateway-authorizer"?: SwaggerLambdaAuthorizer | SwaggerCognitoAuthorizer;
}
export interface SwaggerLambdaAuthorizer {
    type: "token" | "request";
    authorizerUri: pulumi.Input<string>;
    authorizerCredentials: pulumi.Input<string>;
    identitySource?: string;
    identityValidationExpression?: string;
    authorizerResultTtlInSeconds?: number;
}
export interface SwaggerCognitoAuthorizer {
    type: "cognito_user_pools";
    identitySource: string;
    providerARNs: pulumi.Input<string>[];
    authorizerResultTtlInSeconds?: number;
}
export interface SwaggerParameter {
    name: string;
    in: string;
    required: boolean;
    type?: string;
}
export interface SwaggerResponse {
    description: string;
    schema?: SwaggerSchema;
    headers?: {
        [header: string]: SwaggerHeader;
    };
}
export interface SwaggerSchema {
    type: string;
}
export interface SwaggerHeader {
    type: "string" | "number" | "integer" | "boolean" | "array";
    items?: SwaggerItems;
}
export interface SwaggerItems {
    type: "string" | "number" | "integer" | "boolean" | "array";
    items?: SwaggerItems;
}
export interface SwaggerAPIGatewayIntegrationResponse {
    statusCode: string;
    responseParameters?: {
        [key: string]: string;
    };
}
export interface ApigatewayIntegration {
    requestParameters?: any;
    passthroughBehavior?: pulumi.Input<IntegrationPassthroughBehavior>;
    httpMethod: pulumi.Input<Method>;
    type: pulumi.Input<IntegrationType>;
    responses?: {
        [pattern: string]: SwaggerAPIGatewayIntegrationResponse;
    };
    uri: pulumi.Input<string>;
    connectionType?: pulumi.Input<IntegrationConnectionType | undefined>;
    connectionId?: pulumi.Input<string | undefined>;
    credentials?: pulumi.Output<string>;
}
export interface ApigatewayAuth {
    type: string;
}
export declare type Method = "ANY" | "GET" | "PUT" | "POST" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";
export declare type IntegrationConnectionType = "INTERNET" | "VPC_LINK";
export declare type IntegrationType = "aws" | "aws_proxy" | "http" | "http_proxy" | "mock";
export declare type IntegrationPassthroughBehavior = "when_no_match" | "when_no_templates" | "never";
export declare type RequestValidator = "ALL" | "PARAMS_ONLY" | "BODY_ONLY";
export declare type APIKeySource = "HEADER" | "AUTHORIZER";
