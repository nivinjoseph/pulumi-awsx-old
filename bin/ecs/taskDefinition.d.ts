import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as awssdk from "aws-sdk";
import * as ecs from ".";
import * as x from "..";
export declare abstract class TaskDefinition extends pulumi.ComponentResource {
    readonly taskDefinition: aws.ecs.TaskDefinition;
    readonly logGroup?: aws.cloudwatch.LogGroup;
    readonly containers: Record<string, ecs.Container>;
    readonly taskRole?: aws.iam.Role;
    readonly executionRole?: aws.iam.Role;
    /**
     * Mapping from container in this task to the ELB listener exposing it through a load balancer.
     * Only present if a listener was provided in [Container.portMappings] or in
     * [Container.applicationListener] or [Container.networkListener].
     */
    readonly listeners: Record<string, x.lb.Listener>;
    readonly applicationListeners: Record<string, x.lb.ApplicationListener>;
    readonly networkListeners: Record<string, x.lb.NetworkListener>;
    /**
     * Run one or more instances of this TaskDefinition using the ECS `runTask` API, returning the Task instances.
     *
     * This wrapper around `runTask` provides appropriate defaults based on the TaskDefinition and allows specifying a Cluster instead of individual network configurations.
     *
     * This API is designed for use at runtime.
     */
    readonly run: (params: RunTaskRequest) => Promise<awssdk.ECS.Types.RunTaskResponse>;
    constructor(type: string, name: string, isFargate: boolean, args: TaskDefinitionArgs, opts: pulumi.ComponentResourceOptions);
    /**
     * Creates the [taskRole] for a [TaskDefinition] if not provided explicitly. If
     * [assumeRolePolicy] is provided it will be used when creating the task, otherwise
     * [defaultRoleAssumeRolePolicy] will be used.  If [policyArns] are provided, they will be used
     * to create [RolePolicyAttachment]s for the Role.  Otherwise, [defaultTaskRolePolicyARNs] will
     * be used.
     */
    static createTaskRole(name: string, assumeRolePolicy?: string | aws.iam.PolicyDocument, policyArns?: string[], opts?: pulumi.ComponentResourceOptions): aws.iam.Role;
    /**
     * Creates the [executionRole] for a [TaskDefinition] if not provided explicitly. If
     * [assumeRolePolicy] is provided it will be used when creating the task, otherwise
     * [defaultRoleAssumeRolePolicy] will be used.  If [policyArns] are provided, they will be used
     * to create [RolePolicyAttachment]s for the Role.  Otherwise, [defaultExecutionRolePolicyARNs] will
     * be used.
     */
    static createExecutionRole(name: string, assumeRolePolicy?: string | aws.iam.PolicyDocument, policyArns?: string[], opts?: pulumi.ComponentResourceOptions): aws.iam.Role;
    static defaultRoleAssumeRolePolicy(): aws.iam.PolicyDocument;
    static defaultTaskRolePolicyARNs(): ("arn:aws:iam::aws:policy/AWSLambda_FullAccess" | "arn:aws:iam::aws:policy/AmazonECS_FullAccess")[];
    static defaultExecutionRolePolicyARNs(): string[];
}
export interface RunTaskRequest {
    /**
     * The Cluster to run the Task within.
     */
    cluster: ecs.Cluster;
    /**
     * A list of container overrides in JSON format that specify the name of a container in the specified task definition and the overrides it should receive. You can override the default command for a container (that is specified in the task definition or Docker image) with a command override. You can also override existing environment variables (that are specified in the task definition or Docker image) on a container or add new environment variables to it with an environment override.  A total of 8192 characters are allowed for overrides. This limit includes the JSON formatting characters of the override structure.
     */
    overrides?: awssdk.ECS.TaskOverride;
    /**
     * The number of instantiations of the specified task to place on your cluster. You can specify up to 10 tasks per call.
     */
    count?: awssdk.ECS.BoxedInteger;
    /**
     * An optional tag specified when a task is started. For example, if you automatically trigger a task to run a batch process job, you could apply a unique identifier for that job to your task with the startedBy parameter. You can then identify which tasks belong to that job by filtering the results of a ListTasks call with the startedBy value. Up to 36 letters (uppercase and lowercase), numbers, hyphens, and underscores are allowed. If a task is started by an Amazon ECS service, then the startedBy parameter contains the deployment ID of the service that starts it.
     */
    startedBy?: awssdk.ECS.String;
    /**
     * The name of the task group to associate with the task. The default value is the family name of the task definition (for example, family:my-family-name).
     */
    group?: awssdk.ECS.String;
    /**
     * An array of placement constraint objects to use for the task. You can specify up to 10 constraints per task (including constraints in the task definition and those specified at runtime).
     */
    placementConstraints?: awssdk.ECS.PlacementConstraints;
    /**
     * The placement strategy objects to use for the task. You can specify a maximum of five strategy rules per task.
     */
    placementStrategy?: awssdk.ECS.PlacementStrategies;
    /**
     * The platform version the task should run. A platform version is only specified for tasks using the Fargate launch type. If one is not specified, the LATEST platform version is used by default. For more information, see AWS Fargate Platform Versions in the Amazon Elastic Container Service Developer Guide.
     */
    platformVersion?: awssdk.ECS.String;
    /**
     * The network configuration for the task. This parameter is required for task definitions that use the awsvpc network mode to receive their own elastic network interface, and it is not supported for other network modes. For more information, see Task Networking in the Amazon Elastic Container Service Developer Guide.
     */
    networkConfiguration?: awssdk.ECS.NetworkConfiguration;
    /**
     * The metadata that you apply to the task to help you categorize and organize them. Each tag consists of a key and an optional value, both of which you define. Tag keys can have a maximum character length of 128 characters, and tag values can have a maximum length of 256 characters.
     */
    tags?: awssdk.ECS.Tags;
    /**
     * Specifies whether to enable Amazon ECS managed tags for the task. For more information, see Tagging Your Amazon ECS Resources in the Amazon Elastic Container Service Developer Guide.
     */
    enableECSManagedTags?: awssdk.ECS.Boolean;
    /**
     * Specifies whether to propagate the tags from the task definition or the service to the task. If no value is specified, the tags are not propagated.
     */
    propagateTags?: awssdk.ECS.PropagateTags;
}
export interface TaskDefinitionArgs {
    /**
     * The vpc that the service for this task will run in.  Does not normally need to be explicitly
     * provided as it will be inferred from the cluster the service is associated with.
     */
    vpc?: x.ec2.Vpc;
    /**
     * Log group for logging information related to the service.  If `undefined` a default instance
     * with a one-day retention policy will be created.  If `null`, no log group will be created.
     */
    logGroup?: aws.cloudwatch.LogGroup | null;
    /**
     * All the containers to make a ClusterTaskDefinition from.  Useful when creating a
     * ClusterService that will contain many containers within.
     *
     * Either [container] or [containers] must be provided.
     */
    containers: Record<string, ecs.Container>;
    /**
     * The number of cpu units used by the task.  If not provided, a default will be computed
     * based on the cumulative needs specified by [containerDefinitions]
     */
    cpu?: pulumi.Input<string>;
    /**
     * The execution role that the Amazon ECS container agent and the Docker daemon can assume.
     *
     * If `undefined`, a default will be created for the task.  If `null`, no task will be created.
     */
    executionRole?: aws.iam.Role | null;
    /**
     * An optional family name for the Task Definition. If not specified, then a suitable default will be created.
     */
    family?: pulumi.Input<string>;
    /**
     * Configuration block(s) with Inference Accelerators settings. Detailed below.
     */
    inferenceAccelerators?: pulumi.Input<pulumi.Input<aws.types.input.ecs.TaskDefinitionInferenceAccelerator>[]>;
    /**
     * The IPC resource namespace to be used for the containers in the task The valid values are `host`, `task`, and `none`.
     */
    ipcMode?: pulumi.Input<string>;
    /**
     * The amount (in MiB) of memory used by the task.  If not provided, a default will be computed
     * based on the cumulative needs specified by [containerDefinitions]
     */
    memory?: pulumi.Input<string>;
    /**
     * The Docker networking mode to use for the containers in the task. The valid values are
     * `none`, `bridge`, `awsvpc`, and `host`.
     */
    networkMode?: pulumi.Input<"none" | "bridge" | "awsvpc" | "host">;
    /**
     * The process namespace to use for the containers in the task. The valid values are `host` and `task`.
     */
    pidMode?: pulumi.Input<string>;
    /**
     * A set of placement constraints rules that are taken into consideration during task placement.
     * Maximum number of `placement_constraints` is `10`.
     */
    placementConstraints?: aws.ecs.TaskDefinitionArgs["placementConstraints"];
    /**
     * The proxy configuration details for the App Mesh proxy.
     */
    proxyConfiguration?: aws.ecs.TaskDefinitionArgs["proxyConfiguration"];
    /**
     * A set of launch types required by the task. The valid values are `EC2` and `FARGATE`.
     */
    requiresCompatibilities: pulumi.Input<["FARGATE"] | ["EC2"]>;
    /**
     * Key-value mapping of resource tags
     */
    tags?: pulumi.Input<aws.Tags>;
    /**
     * IAM role that allows your Amazon ECS container task to make calls to other AWS services. If
     * `undefined`, a default will be created for the task.  If `null`, no task will be created.
     */
    taskRole?: aws.iam.Role | null;
    /**
     * A set of volume blocks that containers in your task may use.
     */
    volumes?: aws.ecs.TaskDefinitionArgs["volumes"];
}
