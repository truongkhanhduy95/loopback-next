// Copyright IBM Corp. 2018,2019. All Rights Reserved.
// Node module: @loopback/repository
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import * as debugFactory from 'debug';
import {camelCase} from 'lodash';
import {InvalidRelationError} from '../../errors';
import {isTypeResolver} from '../../type-resolver';
import {HasOneDefinition, RelationType} from '../relation.types';

const debug = debugFactory('loopback:repository:has-one-helpers');

/**
 * @internal
 */
export type HasOneResolvedDefinition = HasOneDefinition & {keyTo: string};

/**
 * Resolves given hasOne metadata if target is specified to be a resolver.
 * Mainly used to infer what the `keyTo` property should be from the target's
 * hasOne metadata
 * @param relationMeta - hasOne metadata to resolve
 * @internal
 */
export function resolveHasOneMetadata(
  relationMeta: HasOneDefinition,
): HasOneResolvedDefinition {
  if ((relationMeta.type as RelationType) !== RelationType.hasOne) {
    const reason = 'relation type must be HasOne';
    throw new InvalidRelationError(reason, relationMeta);
  }

  if (!isTypeResolver(relationMeta.target)) {
    const reason = 'target must be a type resolver';
    throw new InvalidRelationError(reason, relationMeta);
  }

  if (relationMeta.keyTo) {
    // The explict cast is needed because of a limitation of type inference
    return relationMeta as HasOneResolvedDefinition;
  }

  const sourceModel = relationMeta.source;
  if (!sourceModel || !sourceModel.modelName) {
    const reason = 'source model must be defined';
    throw new InvalidRelationError(reason, relationMeta);
  }

  const targetModel = relationMeta.target();
  debug(
    'Resolved model %s from given metadata: %o',
    targetModel.modelName,
    targetModel,
  );
  const defaultFkName = camelCase(sourceModel.modelName + '_id');
  const hasDefaultFkProperty =
    targetModel.definition &&
    targetModel.definition.properties &&
    targetModel.definition.properties[defaultFkName];

  if (!hasDefaultFkProperty) {
    const reason = `target model ${
      targetModel.name
    } is missing definition of foreign key ${defaultFkName}`;
    throw new InvalidRelationError(reason, relationMeta);
  }

  return Object.assign(relationMeta, {keyTo: defaultFkName});
}
