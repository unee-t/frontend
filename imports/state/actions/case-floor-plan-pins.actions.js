// @flow
export const CHANGE_FLOOR_PLAN_PINS = 'change_floor_plan_pins_for_case'

type FloorPlanPins = Array<{
  x: number,
  y: number
}>
export function changeFloorPlanPins (caseId: number, floorPlanPins: FloorPlanPins, floorPlanId: number) {
  return {
    type: CHANGE_FLOOR_PLAN_PINS,
    caseId,
    floorPlanPins,
    floorPlanId
  }
}
