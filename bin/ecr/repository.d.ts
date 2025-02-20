import * as aws from "@pulumi/aws";
import * as docker from "@pulumi/docker";
import * as pulumi from "@pulumi/pulumi";
import { LifecyclePolicyArgs } from "./lifecyclePolicy";
import { RepositoryImage } from "./repositoryImage";
/**
 * A [Repository] represents an [aws.ecr.Repository] along with an associated [LifecyclePolicy]
 * controlling how images are retained in the repo.
 *
 * Docker images can be built and pushed to the repo using the [buildAndPushImage] method.  This
 * will call into the `@pulumi/docker/buildAndPushImage` function using this repo as the appropriate
 * destination registry.
 */
export declare class Repository extends pulumi.ComponentResource {
    readonly repository: aws.ecr.Repository;
    readonly lifecyclePolicy: aws.ecr.LifecyclePolicy | undefined;
    constructor(name: string, args?: RepositoryArgs, opts?: pulumi.ComponentResourceOptions);
    /**
     * Builds the docker container specified by [pathOrBuild] and pushes it to this repository.
     * The result is the unique ID pointing to that pushed image in this repo.  This unique ID
     * can be passed as the value to `image: repo.buildAndPushImage(...)` in an `ecs.Container`.
     */
    buildAndPushImage(pathOrBuild: pulumi.Input<string | docker.DockerBuild>): pulumi.Output<string>;
}
/**
 * Creates a new [Repository], optionally configured using [args], builds the docker container
 * specified by [pathOrBuild] and then pushes the built image to the repository.  The result
 * contains both the Repository created as well as the unique ID referencing the built image in that
 * repo.  This result type can be passed in as `image: ecr.buildAndPushImage(...)` for an
 * `ecs.Container`
 */
export declare function buildAndPushImage(name: string, pathOrBuild: pulumi.Input<string | docker.DockerBuild>, args?: RepositoryArgs, opts?: pulumi.ComponentResourceOptions): RepositoryImage;
export interface RepositoryArgs {
    /**
     * Underlying repository.  If not provided, a new one will be created on your behalf.
     */
    repository?: aws.ecr.Repository;
    /**
     * A mapping of tags to assign to the resource.
     */
    tags?: pulumi.Input<Record<string, pulumi.Input<string>>>;
    /**
     * The arguments controlling the [LifecyclePolicy] for this [Repository].  If `undefined`, a default one will be
     * created using `LifecyclePolicy.getDefaultLifecyclePolicyArgs`.
     */
    lifeCyclePolicyArgs?: LifecyclePolicyArgs;
    /**
     * If `true`, will delete the repository even if it contains images.
     * Defaults to `true`.
     */
    forceDelete?: pulumi.Input<boolean>;
}
