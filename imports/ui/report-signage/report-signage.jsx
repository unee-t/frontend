import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Meteor } from 'meteor/meteor'
import { connect } from 'react-redux'
import { goBack } from 'react-router-redux'
import { createContainer } from 'meteor/react-meteor-data'
import FontIcon from 'material-ui/FontIcon'
import CircularProgress from 'material-ui/CircularProgress'
import RaisedButton from 'material-ui/RaisedButton'
import InnerAppBar from '../components/inner-app-bar'
import Reports, { collectionName } from '../../api/reports'
import Units, { collectionName as unitsCollName, getUnitRoles } from '../../api/units'
import Preloader from '../preloader/preloader'
import { infoItemLabel } from '../util/static-info-rendering'
import { userInfoItem } from '../../util/user'
import { placeholderEmailMatcher } from '../../util/matchers'
import SignDialog from '../dialogs/sign-dialog'

const docIconStyle = {
  fontSize: '40px'
}

class ReportSignage extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      chosenUser: null,
      dialogOpen: false,
      signatureMap: {}
    }
  }
  render () {
    const { dispatch, reportItem, isLoading, isLoadingRoles, unitRoles } = this.props
    const { chosenUser, dialogOpen, signatureMap } = this.state
    if (isLoading) return <Preloader />

    return <div className='full-height flex flex-column'>
      <InnerAppBar onBack={() => dispatch(goBack())} title='Sign Report' />
      <div className='flex-grow overflow-auto pa3 flex flex-column'>
        <h4 className='ma0 mid-gray pb1'>Sign the report</h4>
        <div className='ba b--black-20 br2 flex pv2 ph3 mt2 items-center'>
          <div className='relative dib'>
            <FontIcon className='icon-doc' color='var(--gray)' style={docIconStyle} />
            <div className='absolute bottom-0 right-0 pb1 pr2 gray f7'>
              PDF
            </div>
          </div>
          <div className='ml2 mid-gray flex-grow'>
            {reportItem.title}.pdf
          </div>
          <div className='ml2 pl1'>
            <a
              className='link bondi-blue fw5 f6'
              href={`/report/${reportItem.id}/preview`}
              onClick={evt => {
                evt.preventDefault()
                dispatch(goBack())
              }}
            >
              Preview
            </a>
          </div>
        </div>
        <div className='mt3 gray f6 lh-title'>
          Only recipients present during the creation of the report are required to sign
        </div>
        <div className='mt2'>
          {infoItemLabel('Recipients:')}
        </div>
        <div className='flex-grow mt2 flex flex-column'>
          {isLoadingRoles ? (
            <div className='flex-grow flex items-center justify-center'>
              <CircularProgress size={70} thickness={5} />
            </div>
          ) : unitRoles.reduce((all, userRoleDef, ind) => {
            if (!placeholderEmailMatcher(userRoleDef.login)) {
              all.push(
                <div key={ind} className={all.length !== 0 ? 'mt3' : ''}>
                  {userInfoItem(userRoleDef, () => signatureMap[userRoleDef.login] ? (
                    <img className='w3 h-100' src={signatureMap[userRoleDef.login]} />
                  ) : (
                    <a
                      className='link bondi-blue f6 ml2 fw5 pr1'
                      onClick={() => this.setState({chosenUser: userRoleDef, dialogOpen: true})}
                    >
                      Sign Report
                    </a>
                  ))}
                </div>
              )
            }
            return all
          }, [])}
        </div>
        <div className='mt3'>
          <RaisedButton primary fullWidth disabled={Object.keys(signatureMap).length === 0}>
            <span className='f4 white'>Finalize Report</span>
          </RaisedButton>
        </div>
      </div>
      <SignDialog
        open={dialogOpen}
        signingUser={chosenUser}
        onClose={() => this.setState({dialogOpen: false})}
        onSignSubmit={signImgUri => this.setState({
          signatureMap: {
            ...signatureMap,
            [chosenUser.login]: signImgUri
          },
          dialogOpen: false
        })}
      />
    </div>
  }
}

ReportSignage.propTypes = {
  reportItem: PropTypes.object,
  isLoading: PropTypes.bool.isRequired,
  isLoadingRoles: PropTypes.bool.isRequired,
  unitRoles: PropTypes.array
}

export default connect(
  () => ({})
)(createContainer(props => {
  const { reportId } = props.match.params
  const reportHandle = Meteor.subscribe(`${collectionName}.byId`, reportId)
  const reportItem = Reports.findOne({id: parseInt(reportId)})
  let unitHandle, unitRoles
  if (reportItem) {
    unitHandle = Meteor.subscribe(`${unitsCollName}.byNameWithUsers`, reportItem.selectedUnit)
    const unitItem = Units.findOne({name: reportItem.selectedUnit})
    if (unitItem) {
      unitRoles = getUnitRoles(unitItem)
    }
  }
  return {
    isLoading: !reportHandle.ready(),
    isLoadingRoles: !!unitHandle && !unitHandle.ready(),
    reportItem,
    unitRoles
  }
}, ReportSignage))
