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
const aws = require("@pulumi/aws");
const pulumi = require("@pulumi/pulumi");
const ecs_1 = require("../ecs");
const lifecyclePolicy_1 = require("./lifecyclePolicy");
const repositoryImage_1 = require("./repositoryImage");
/**
 * A [Repository] represents an [aws.ecr.Repository] along with an associated [LifecyclePolicy]
 * controlling how images are retained in the repo.
 *
 * Docker images can be built and pushed to the repo using the [buildAndPushImage] method.  This
 * will call into the `@pulumi/docker/buildAndPushImage` function using this repo as the appropriate
 * destination registry.
 */
class Repository extends pulumi.ComponentResource {
    constructor(name, args = {}, opts = {}) {
        var _a;
        super("awsx:ecr:Repository", name, undefined, opts);
        const lowerCaseName = name.toLowerCase();
        this.repository = args.repository || new aws.ecr.Repository(lowerCaseName, { forceDelete: (_a = args.forceDelete, (_a !== null && _a !== void 0 ? _a : true)), tags: args.tags }, { parent: this });
        this.lifecyclePolicy = new lifecyclePolicy_1.LifecyclePolicy(lowerCaseName, this.repository, args.lifeCyclePolicyArgs, { parent: this });
        this.registerOutputs();
    }
    /**
     * Builds the docker container specified by [pathOrBuild] and pushes it to this repository.
     * The result is the unique ID pointing to that pushed image in this repo.  This unique ID
     * can be passed as the value to `image: repo.buildAndPushImage(...)` in an `ecs.Container`.
     */
    buildAndPushImage(pathOrBuild) {
        return pulumi.all([pathOrBuild, this.repository.repositoryUrl, this.repository.registryId])
            .apply(([pathOrBuild, repositoryUrl, registryId]) => ecs_1.computeImageFromAsset(pathOrBuild, repositoryUrl, registryId, this));
    }
}
exports.Repository = Repository;
/**
 * Creates a new [Repository], optionally configured using [args], builds the docker container
 * specified by [pathOrBuild] and then pushes the built image to the repository.  The result
 * contains both the Repository created as well as the unique ID referencing the built image in that
 * repo.  This result type can be passed in as `image: ecr.buildAndPushImage(...)` for an
 * `ecs.Container`
 */
function buildAndPushImage(name, pathOrBuild, args, opts) {
    const repo = new Repository(name, args, opts);
    const image = repo.buildAndPushImage(pathOrBuild);
    return new repositoryImage_1.RepositoryImage(repo, image);
}
exports.buildAndPushImage = buildAndPushImage;
//# sourceMappingURL=repository.js.map