import { useRef, useState } from 'react';
import { Button, ButtonGroup, ButtonToolbar, Form, OverlayTrigger, Spinner, Tooltip } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faHistory, faSave, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Editor } from '@toast-ui/react-editor';
import { noteFromParametersFactory } from './notes';
import { connect } from 'react-redux';
import {
  getDraft,
  getDraftBody,
  getDraftKey,
  getDraftTitle,
  updateBody,
  updateTitle
} from './slices/draftSlice';
import { getNoteStatuses, noteStatus } from './slices/nkSlice';
import { getActiveKey } from './slices/workspaceSlice';

const NoteEditor = ({ onSave, isSaving, activeKey: key, title, body, dispatchUpdateTitle, dispatchUpdateBody }) => {
  const ref = useRef(null);

  if (!key) {
    return null;
  }

  return (
    <div>
      <div className={'pb-4'}>
        <Form.Control
          size={'lg'}
          type={'text'}
          placeholder={'Title'}
          value={title}
          onChange={evt => dispatchUpdateTitle(evt.target.value)}
        />
      </div>

      <div className={'pb-4'}>
        <ButtonToolbar className={'justify-content-between'}>
          <ButtonGroup>
            <Button
              onClick={async () => {
                //setIsSaving(true);
                await onSave({ key, title, body });
                //setIsSaving(false);
              }}
            >
              {
                isSaving
                  ? <Spinner
                    as={'span'}
                    animation={'border'}
                    size={'sm'}
                    role={'status'}
                    aria-hidden={'true'}
                  />
                  : <FontAwesomeIcon icon={faSave} />
              }
            </Button>
            <Button variant={'outline-secondary'}><FontAwesomeIcon icon={faCopy} /></Button>
          </ButtonGroup>
          <ButtonGroup>
            <Button variant={'outline-secondary'}><FontAwesomeIcon icon={faHistory} /></Button>
            <Button variant={'outline-danger'}><FontAwesomeIcon icon={faTrash} /></Button>
          </ButtonGroup>
        </ButtonToolbar>
      </div>

      <Editor
        ref={ref}
        initialValue={body}
        placeholder='Start writing'
        previewStyle='vertical'
        height='600px'
        initialEditType='wysiwyg'
        useCommandShortcut={true}
        onChange={() => dispatchUpdateBody(ref.current.getInstance().getMarkdown())}
      />
    </div>
  );
};

export default connect(
  state => ({
    activeKey: getDraftKey(state),
    title: getDraftTitle(state),
    body: getDraftBody(state),
    isSaving: getNoteStatuses(state)[getDraftKey(state)] === noteStatus.loading,
  }),
  dispatch => ({
    dispatchUpdateTitle: title => dispatch(updateTitle(title)),
    dispatchUpdateBody: body => dispatch(updateBody(body)),
  }),
)(NoteEditor);
