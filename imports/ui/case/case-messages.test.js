/* eslint-env mocha */

import React from 'react'
import { shallow } from 'enzyme'
import { Meteor } from 'meteor/meteor'
import { expect } from 'meteor/practicalmeteor:chai'
import { sinon } from 'meteor/practicalmeteor:sinon'
import moment from 'moment'

if (Meteor.isClient) {
  describe('Case Messages sub-screen component', () => {
    let CaseMessages, styles, initialPublicSettings
    const caseItem = {
      summary: 'Summary for the case',
      product: 'The name of the unit'
    }
    const emptyParams = {
      userEmail: '',
      attachmentUploads: [],
      onCreateComment: () => {},
      onCreateAttachment: () => {},
      onRetryAttachment: () => {},
      onThumbClicked: () => {}
    }
    const findLabel = (comp, labelText) => comp.findWhere(n => n.children().length === 0 && n.text() === labelText)
    const generateComment = (time = Date.now(), text = 'Something to say', creator = 'bla@example.com') => ({
      id: Math.round(Math.random() * Number.MAX_VALUE),
      creation_time: (new Date(time)).toISOString(),
      creator,
      text
    })
    before(() => {
      initialPublicSettings = Meteor.settings.public
      Meteor.settings.public = {
        CLOUDINARY_URL: 'https://api.cloudinary.com/v1_1/demo-env/image/upload',
        CLOUDINARY_PRESET: 'asddsd23asd'
      }
      return Promise.all([import('./case-messages.jsx'), import('./case.mss')]).then(([module, stylesModule]) => {
        CaseMessages = module.default
        styles = stylesModule.styles
      })
    })

    after(() => {
      Meteor.settings.public = initialPublicSettings
    })

    // TODO: Refactor this test into other tests, partly for other components
    it.skip('should render the description of the case, if it was loaded successfully', () => {
      const comp = shallow(<CaseMessages caseItem={caseItem} comments={[]} {...emptyParams} />)

      expect(comp.find(`AppBar[title="${caseItem.product}"]`)).to.have.lengthOf(1)
      expect(findLabel(comp, caseItem.summary)).to.have.lengthOf(1)
    })

    it('should render a comment and a suitable day label when one is provided', () => {
      const comment = generateComment()
      const comp = shallow(<CaseMessages caseItem={caseItem} comments={[comment]} {...emptyParams} />)

      expect(findLabel(comp, 'Today')).to.have.lengthOf(1)
      expect(findLabel(comp, comment.text)).to.have.lengthOf(1)
      expect(findLabel(comp, comment.creator.split('@')[0])).to.have.lengthOf(1)

      // Checking the message appears as someone else's (left-aligned)
      expect(comp.find(`.${styles.messagesContainer}`).childAt(1).not('.tr')).to.have.lengthOf(1)
    })

    it('should render multiple comments from the same day with one label and others for other days', () => {
      const yesterday = new Date(Date.now() - 24 * 36e5) // Minus 24 hours
      const cmtText = 'bla bla'
      const comments = [
        generateComment(yesterday.getTime(), cmtText + ' 1'), // Yesterday
        generateComment(yesterday.getTime() + 6e4, cmtText + ' 2'),
        generateComment(Date.now(), cmtText + ' 3') // Today
      ]
      const comp = shallow(<CaseMessages caseItem={caseItem} comments={comments} {...emptyParams} />)

      expect(findLabel(comp, 'Yesterday')).to.have.lengthOf(1)
      expect(findLabel(comp, 'Today')).to.have.lengthOf(1)

      comments.forEach(comment => {
        expect(findLabel(comp, comment.text)).to.have.lengthOf(1)
      })
    })

    it('should render a day label with as "{month name} {date}" if the comment was made in the past year', () => {
      const closePastDate = new Date(Date.now() - 3 * 24 * 36e5) // 3 days ago
      const pastDate = new Date(Date.now() - 60 * 24 * 36e5) // 60 days ago

      const comp = shallow(<CaseMessages caseItem={caseItem} comments={[
        generateComment(pastDate.getTime()),
        generateComment(closePastDate.getTime())
      ]} {...emptyParams} />)

      expect(findLabel(comp, moment(pastDate).format('MMMM DD'))).to.have.lengthOf(1)
      expect(findLabel(comp, moment(closePastDate).format('MMMM DD'))).to.have.lengthOf(1)
    })

    it('should render a day label with as "{month name} {date}, {year}" for anything over a year ago', () => {
      const pastDate = new Date(Date.now() - 366 * 24 * 36e5) // 366 days ago

      const comp = shallow(<CaseMessages caseItem={caseItem} comments={[generateComment(pastDate.getTime())]} {...emptyParams} />)

      expect(findLabel(comp, moment(pastDate).format('MMMM DD, YYYY'))).to.have.lengthOf(1)
    })

    it('should render a self made comment right aligned and with no creator label', () => {
      const meEmail = 'bla123@example.com'
      const comment = generateComment(Date.now(), 'bla bla', meEmail)

      const comp = shallow(<CaseMessages {...emptyParams} caseItem={caseItem} comments={[comment]} userEmail={meEmail} />)

      expect(findLabel(comp, comment.creator)).to.have.lengthOf(0) // No label
      expect(comp.find(`.${styles.messagesContainer}`).childAt(1).is('.tr')).to.be.true()
    })
    describe('UI interaction', () => {
      it('should trigger "onCreateComment" with the input\'s content when the send button is clicked', () => {
        const value = 'A new message'
        const onCreateComment = sinon.spy()

        const comp = shallow(
          <CaseMessages {...emptyParams}
            caseItem={caseItem} comments={[]} userEmail='mail@example.com' onCreateComment={onCreateComment} />
        )
        comp.find(`.${styles.inputRow} input[type="text"]`)
          .simulate('change', {target: {value}}) // Triggering the change
        comp.find('FloatingActionButton').simulate('click', {preventDefault: () => {}})

        expect(onCreateComment).to.have.been.calledWith(value)
      })
    })

    describe('auto scrolling', () => {
      // TODO: Find a sane way to test this. Gave up for now
    })

    describe('Using attachments', () => {
      // TODO: Implement tests
    })
  })
}
