// @flow
/* global File */
import * as React from 'react'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import RaisedButton from 'material-ui/RaisedButton'
import FontIcon from 'material-ui/FontIcon'
import type { Dimensions } from '/imports/state/actions/unit-floor-plan.actions'
import { fileInputReaderEventHandler } from '../util/dom-api'
import UploadPreloader from './upload-preloader'
import FileInput from './file-input'
import { UploadIcon } from './generic-icons'
import { disableFloorPlan, uploadFloorPlan } from '/imports/state/actions/unit-floor-plan.actions'

type Process = {
  preview: string,
  dimensions: Dimensions,
  file: File,
  percent: number
}
type Props = {
  uploadProcess: Process,
  unitMetaData: {
    _id: string,
    floorPlanUrls: ?Array<{
      url: string,
      disabled: ?boolean
    }>
  },
  dispatch: (action: any) => void,
  children: ?React.Node
}

class FloorPlanUploader extends React.Component<Props> {
  render () {
    const { uploadProcess, unitMetaData, dispatch, children } = this.props
    const activeFloorPlan = unitMetaData.floorPlanUrls &&
      !unitMetaData.floorPlanUrls.slice(-1)[0].disabled &&
      unitMetaData.floorPlanUrls.slice(-1)[0]
    const floorPlanUrl = uploadProcess ? uploadProcess.preview : activeFloorPlan && activeFloorPlan.url

    if (floorPlanUrl && (uploadProcess || !children)) {
      return (
        <div>
          <div className='w-100 h5 relative ba b--gray-93'>
            <img
              className={'obj-contain w-100 h-100' + (uploadProcess ? ' o-60' : '')}
              src={floorPlanUrl}
              alt='Floor Plan Thumbnail'
            />
            {uploadProcess && (
              <UploadPreloader
                stickToTop
                process={uploadProcess}
                handleRetryUpload={proc => dispatch(uploadFloorPlan(unitMetaData._id, proc.preview, proc.file, proc.dimensions))}
              />
            )}
          </div>
          {!uploadProcess && (
            <div className='flex relative'>
              <div className='flex-grow'>
                <RaisedButton fullWidth>
                  <FileInput onFileSelected={fileInputReaderEventHandler(
                    (preview, file, dimensions) => dispatch(uploadFloorPlan(unitMetaData._id, preview, file, dimensions))
                  )}>
                    <div className='flex items-center justify-center'>
                      <UploadIcon fillColor='var(--bondi-blue)' />
                      <div className='ml1 bondi-blue fw5 f6'>
                        Upload again
                      </div>
                    </div>
                  </FileInput>
                </RaisedButton>
              </div>
              <div className='bl b--gray-93 flex-grow'>
                <RaisedButton fullWidth onClick={() => dispatch(disableFloorPlan(unitMetaData._id))}>
                  <div className='flex items-center justify-center'>
                    <FontIcon className='material-icons' color='var(--bondi-blue)'>delete</FontIcon>
                    <div className='ml1 bondi-blue fw5 f6'>
                      Remove floor plan
                    </div>
                  </div>
                </RaisedButton>
              </div>
            </div>
          )}
        </div>
      )
    } else if (floorPlanUrl && children) {
      return children
    } else {
      return (
        <RaisedButton fullWidth>
          <FileInput onFileSelected={fileInputReaderEventHandler(
            (preview, file, dimensions) => dispatch(uploadFloorPlan(unitMetaData._id, preview, file, dimensions))
          )}>
            <div className='flex items-center justify-center'>
              <UploadIcon fillColor='var(--bondi-blue)' />
              <div className='ml1 bondi-blue fw5 f6'>
                Upload floor plan
              </div>
            </div>
          </FileInput>
        </RaisedButton>
      )
    }
  }
}

export default connect(({ unitFloorPlanUploadState }, props: Props) => {
  const uploadProcess = unitFloorPlanUploadState.find(process => process.unitMongoId === props.unitMetaData._id)
  return {
    uploadProcess
  }
})(createContainer(() => ({}), FloorPlanUploader))
