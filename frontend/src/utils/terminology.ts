import { STAGES_CATALOG, type StageDefinition, type TerminologyMode } from '../types'

export { STAGES_CATALOG, type StageDefinition, type TerminologyMode }

export interface FormattedTerm {
  primary: string
  secondary?: string
}

export function getStageByStep(step: string): StageDefinition | undefined {
  return STAGES_CATALOG.find((s) => s.step === step)
}

export function getStageByTech(techKey: string): StageDefinition | undefined {
  return STAGES_CATALOG.find((s) => s.tech.includes(techKey))
}

export function formatStageLabel(
  stage: StageDefinition,
  mode: TerminologyMode = 'both'
): FormattedTerm {
  switch (mode) {
    case 'plain':
      return { primary: stage.plain }
    case 'tech':
      return { primary: stage.tech }
    case 'both':
    default:
      return {
        primary: stage.plain,
        secondary: stage.tech,
      }
  }
}

export function formatDualTerm(
  plain: string,
  tech: string,
  mode: TerminologyMode = 'both'
): FormattedTerm {
  switch (mode) {
    case 'plain':
      return { primary: plain }
    case 'tech':
      return { primary: tech }
    case 'both':
    default:
      return { primary: plain, secondary: tech }
  }
}
