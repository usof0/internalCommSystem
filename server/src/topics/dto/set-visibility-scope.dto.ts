import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export type ScopeType =
  | 'ALL_MEMBERS'
  | 'INCLUDE_MEMBERS'
  | 'EXCLUDE_MEMBERS'
  | 'ORG_UNIT'
  | 'ORG_UNIT_TAG';

export class SetVisibilityScopeDto {
  @IsEnum(['ALL_MEMBERS', 'INCLUDE_MEMBERS', 'EXCLUDE_MEMBERS', 'ORG_UNIT', 'ORG_UNIT_TAG'])
  scopeType: ScopeType;

  /** Required when scopeType is INCLUDE_MEMBERS or EXCLUDE_MEMBERS */
  @ValidateIf((o) => ['INCLUDE_MEMBERS', 'EXCLUDE_MEMBERS'].includes(o.scopeType))
  @IsArray()
  @IsUUID('4', { each: true })
  memberIds?: string[];

  /** Required when scopeType is ORG_UNIT */
  @ValidateIf((o) => o.scopeType === 'ORG_UNIT')
  @IsArray()
  @IsUUID('4', { each: true })
  orgUnitIds?: string[];

  /** Optional for ORG_UNIT scope */
  @IsOptional()
  @IsBoolean()
  includeSubUnits?: boolean;

  /** Required when scopeType is ORG_UNIT_TAG */
  @ValidateIf((o) => o.scopeType === 'ORG_UNIT_TAG')
  @IsArray()
  @IsUUID('4', { each: true })
  orgUnitTagIds?: string[];
}
