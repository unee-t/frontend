// @flow
import { Meteor } from 'meteor/meteor'
import userApiKey, { bodyExtractor, headerExtractor, makeComposedExtractor } from '../middleware/user-api-key-middleware'
import { check, Match } from 'meteor/check'
import { logger } from '../../../util/logger'
import { createCase } from '../../cases'
import { serverHelpers } from '../../units'
import UnitMetaData from '../../unit-meta-data'
import { attemptUserGeneration, verifyRole, assigneeAllowedRoles, isDateString } from './common'
import { roleEnum } from '../../unit-roles-data'
import { emailValidator } from '../../../util/validators'

import type { Request, Response } from '../rest-types'

const reporterAllowedRoles = Object.values(roleEnum)

export default userApiKey((req: Request, res: Response) => {
  const errorLog = 'API request for "POST /cases" failed: '

  //
  // Payload validation checks
  //
  try {
    check(req.body, Match.ObjectIncluding({
      title: String,
      details: Match.Maybe(String),
      assignedRole: Match.OneOf(...assigneeAllowedRoles),
      reporterRole: Match.Maybe(Match.OneOf(...reporterAllowedRoles)),
      category: Match.Maybe(String),
      subCategory: Match.Maybe(String),
      severity: Match.Maybe(String),
      priority: Match.Maybe(String),
      solution: Match.Maybe(String),
      solutionDeadline: Match.Maybe(Match.Where(isDateString)),
      nextSteps: Match.Maybe(String),
      nextStepsBy: Match.Maybe(Match.Where(isDateString))
    }))
    try {
      check(req.body, Match.OneOf(
        Match.ObjectIncluding({ unitId: String }),
        Match.ObjectIncluding({ unitAliasId: String })
      ))
    } catch (e) {
      throw new Meteor.Error('The request\'s body must contain either "unitId"(String) or "unitAliasId"(String)')
    }
    try {
      check(req.body, Match.OneOf(
        Match.ObjectIncluding({ assigneeId: Match.Maybe(String) }),
        Match.ObjectIncluding({ assigneeAliasId: Match.Maybe(String) })
      ))
    } catch (e) {
      throw new Meteor.Error('The request\'s body can contain either "assigneeId"(String) or "assigneeAliasId"(String)')
    }
    try {
      check(req.body, Match.OneOf(
        Match.ObjectIncluding({ reporterId: Match.Maybe(String) }),
        Match.ObjectIncluding({ reporterAliasId: Match.Maybe(String) })
      ))
    } catch (e) {
      throw new Meteor.Error('The request\'s body can contain  either "reporterId"(String) or "reporterAliasId"(String)')
    }
  } catch (e) {
    logger.warn(errorLog + e.message)
    res.send(400, e.message)
    return
  }

  //
  // Data fetching
  //

  const {
    unitId,
    unitAliasId,
    reporterId,
    reporterAliasId,
    reporterRole,
    title,
    details,
    category,
    subCategory,
    assignedRole,
    assigneeId,
    assigneeAliasId,
    severity,
    priority,
    solution,
    solutionDeadline,
    nextSteps,
    nextStepsBy
  } = req.body

  const unitMeta = unitId
    ? UnitMetaData.findOne({ _id: unitId })
    : UnitMetaData.findOne({
      apiAliases: {
        userId: req.user._id,
        id: unitAliasId
      }
    })
  if (!unitMeta) {
    const message = 'No unit found for ' + (unitId ? `unitId ${unitId}` : `unitAliasId ${unitAliasId}`)
    logger.warn(errorLog + message)
    res.send(400, message)
    return
  }

  let reporter
  if (!reporterId && !reporterAliasId) {
    reporter = req.user
  } else {
    reporter = reporterId
      ? Meteor.users.findOne({ _id: reporterId })
      : Meteor.users.findOne({
        apiAliases: {
          userId: req.user._id,
          id: reporterAliasId
        }
      })

    if (!reporter) {
      if (reporterAliasId && reporterRole && emailValidator(reporterAliasId)) {
        reporter = attemptUserGeneration(reporterAliasId, req.user)
      }
      if (!reporter) {
        const message = 'No user found as reporter for ' + (reporterId ? `reporterId ${reporterId}` : `reporterAliasId ${reporterAliasId}`)
        logger.warn(errorLog + message)
        res.send(400, message)
        return
      }
    } else if (reporter.profile.creatorId !== req.user._id && reporter._id !== req.user._id) {
      const message = 'The provided apiKey doesn\'t belong to a user who is allowed to set the specified user as reporter'
      logger.warn(errorLog + message)
      res.send(403, message)
      return
    }
  }

  const handleVerifyError = e => {
    if (e.reason === 'server error') {
      res.send(500, e.message)
    } else {
      logger.warn(errorLog + e.message)
      res.send(400, e.message)
    }
  }

  try {
    verifyRole(req.user, reporter, unitMeta, reporterRole, {
      user: req.user._id,
      apiEndpoint: `POST /api/cases`,
      step: 'assign reporter to a new role in this unit',
      args: req.body
    })
  } catch (e) {
    handleVerifyError(e)
    return
  }

  let unitItem
  try {
    unitItem = serverHelpers.getAPIUnitByName(unitMeta.bzName, reporter.bugzillaCreds.apiKey)
  } catch (e) {
    logger.warn(errorLog + e.message)
    res.send(400, e.message)
    return
  }
  if (!unitItem) {
    const message = 'The user specified as reporter does not have visibility of the specified unit'
    logger.warn(errorLog + message)
    res.send(400, message)
    return
  }

  let assignee
  if (assigneeId || assigneeAliasId) {
    let assigneeUser = assigneeId
      ? Meteor.users.findOne({ _id: assigneeId })
      : Meteor.users.findOne({
        apiAliases: {
          userId: req.user._id,
          id: assigneeAliasId
        }
      })
    if (!assigneeUser) {
      if (assigneeAliasId && emailValidator(assigneeAliasId)) {
        assigneeUser = attemptUserGeneration(assigneeAliasId, req.user._id)
      }
      if (!assigneeUser) {
        const message = 'No user found as assignee for ' + (assigneeId ? `assigneeId ${assigneeId}` : `assigneeAliasId ${assigneeAliasId}`)
        logger.warn(errorLog + message)
        res.send(400, message)
        return
      }
    }

    try {
      verifyRole(req.user, assigneeUser, unitMeta, assignedRole, {
        user: req.user._id,
        apiEndpoint: `POST /api/cases`,
        step: 'assign assignee to a new role in this unit',
        args: req.body
      })
    } catch (e) {
      handleVerifyError(e)
      return
    }

    assignee = assigneeUser.bugzillaCreds.login
  }

  let newCaseId
  try {
    newCaseId = createCase(
      reporter,
      unitItem,
      {
        title,
        details,
        category,
        subCategory,
        assignee,
        severity,
        priority,
        solution,
        solutionDeadline,
        nextSteps,
        nextStepsBy,
        assignedUnitRole: assignedRole
      }
    )
  } catch (e) {
    logger.warn(errorLog + e.message)
    res.send(500, e.message)
    return
  }

  res.send(200, { id: newCaseId })
}, makeComposedExtractor(bodyExtractor, headerExtractor))
