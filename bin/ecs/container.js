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
const x = require("..");
const utils = require("../utils");
/** @internal */
function computeContainerDefinition(parent, name, vpc, containerName, container, applicationListeners, networkListeners, logGroup) {
    const image = isContainerImageProvider(container.image)
        ? container.image.image(name, parent)
        : container.image;
    const environment = isContainerImageProvider(container.image)
        ? utils.combineArrays(container.environment, container.image.environment(name, parent))
        : container.environment;
    const portMappings = getPortMappings(parent, name, vpc, container, containerName, applicationListeners, networkListeners);
    const region = utils.getRegion(parent);
    const logGroupId = logGroup ? logGroup.id : undefined;
    const containerDefinition = pulumi.all([container, logGroupId, image, environment, portMappings, region])
        .apply(([container, logGroupId, image, environment, portMappings, region]) => {
        const containerDefinition = Object.assign(Object.assign({}, container), { image,
            environment,
            portMappings, name: containerName });
        if (containerDefinition.logConfiguration === undefined && logGroupId !== undefined) {
            containerDefinition.logConfiguration = {
                logDriver: "awslogs",
                options: {
                    "awslogs-group": logGroupId,
                    "awslogs-region": region,
                    "awslogs-stream-prefix": containerName,
                },
            };
        }
        return containerDefinition;
    });
    return containerDefinition;
}
exports.computeContainerDefinition = computeContainerDefinition;
function getPortMappings(parent, name, vpc, container, containerName, applicationListeners, networkListeners) {
    if (container.applicationListener && container.networkListener) {
        throw new pulumi.ResourceError(`Container '${name}' supplied [applicationListener] and [networkListener]`, parent);
    }
    const hasLoadBalancerInfo = !!container.applicationListener || !!container.networkListener;
    if (!container.portMappings && !hasLoadBalancerInfo) {
        return undefined;
    }
    if (container.portMappings && hasLoadBalancerInfo) {
        throw new pulumi.ResourceError(`Container '${name}' supplied [portMappings] and a listener`, parent);
    }
    const result = [];
    let possibleListener;
    if (container.portMappings) {
        for (const obj of container.portMappings) {
            const portMapping = pulumi.output(isContainerPortMappingProvider(obj)
                ? obj.containerPortMapping(name, parent)
                : obj);
            result.push(pulumi.output(portMapping));
            possibleListener = obj;
        }
    }
    else {
        const listener = createListener();
        possibleListener = listener;
        result.push(pulumi.output(listener.containerPortMapping(name, parent)));
    }
    if (x.lb.ApplicationListener.isApplicationListenerInstance(possibleListener)) {
        applicationListeners[containerName] = possibleListener;
    }
    else if (x.lb.NetworkListener.isNetworkListenerInstance(possibleListener)) {
        networkListeners[containerName] = possibleListener;
    }
    return pulumi.all(result).apply(mappings => convertMappings(mappings));
    function createListener() {
        const opts = { parent };
        const errorMessage = `[vpc] must be supplied to task definition in order to create a listener for container ${name}`;
        if (container.applicationListener) {
            if (pulumi.Resource.isInstance(container.applicationListener)) {
                return container.applicationListener;
            }
            if (!vpc) {
                throw new pulumi.ResourceError(errorMessage, parent);
            }
            return new x.lb.ApplicationListener(name, Object.assign(Object.assign({}, container.applicationListener), { vpc }), opts);
        }
        else if (container.networkListener) {
            if (pulumi.Resource.isInstance(container.networkListener)) {
                return container.networkListener;
            }
            if (!vpc) {
                throw new pulumi.ResourceError(errorMessage, parent);
            }
            return new x.lb.NetworkListener(name, Object.assign(Object.assign({}, container.networkListener), { vpc }), opts);
        }
        else {
            throw new Error("Unreachable");
        }
    }
}
function convertMappings(mappings) {
    const result = [];
    for (const mapping of mappings) {
        const copy = Object.assign({}, mapping);
        if (copy.hostPort === undefined) {
            // From https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html:
            // > For task definitions that use the awsvpc network mode, you should only specify
            // > the containerPort. The hostPort can be left blank or it must be the same value
            // > as the containerPort.
            //
            // However, if left blank, it will be automatically populated by AWS, potentially
            // leading to dirty diffs even when no changes have been made. Since we are
            // currently always using `awsvpc` mode, we go ahead and populate it with the same
            // value as `containerPort`.
            //
            // See https://github.com/terraform-providers/terraform-provider-aws/issues/3401.
            copy.hostPort = copy.containerPort;
        }
        result.push(copy);
    }
    return result;
}
/** @internal */
function isContainerPortMappingProvider(obj) {
    return obj && obj.containerPortMapping instanceof Function;
}
exports.isContainerPortMappingProvider = isContainerPortMappingProvider;
/** @internal */
function isContainerLoadBalancerProvider(obj) {
    return obj && obj.containerLoadBalancer instanceof Function;
}
exports.isContainerLoadBalancerProvider = isContainerLoadBalancerProvider;
/** @internal */
function isContainerImageProvider(obj) {
    return obj &&
        obj.image instanceof Function &&
        obj.environment instanceof Function;
}
exports.isContainerImageProvider = isContainerImageProvider;
// Make sure our exported args shape is compatible with the overwrite shape we're trying to provide.
const test1 = utils.checkCompat();
//# sourceMappingURL=container.js.map