import { useEffect, useRef, useState } from 'react';
import { Button, ButtonGroup, ButtonToolbar, Form, Modal, OverlayTrigger, Spinner, Tooltip } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faHistory, faSave, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Editor } from '@toast-ui/react-editor';
import { connect } from 'react-redux';
import {
  getDraft,
  getDraftKey,
  newDraftUpdatedInternal,
  updateBody,
  updateTitle
} from './slices/draftSlice';
import { getNoteStatuses, noteStatus } from './slices/nkSlice';
import { getActiveKey } from './slices/workspaceSlice';

const NoteEditor = ({
  onSave, onDuplicate, onDelete, isSaving,
  draft: { key, drafts, newDraft },
  dispatchNewDraftInternal, dispatchUpdateTitle, dispatchUpdateBody }) => {

  const { title, body, lastUpdatedAt, } = drafts[key] || {};

  const ref = useRef(null);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (newDraft) {
      if (ref.current) {
        ref.current.getInstance().setMarkdown(body);
      }

      dispatchNewDraftInternal();
    }
  });

  if (!key) {
    return null;
  }

  const lastUpdateTime = new Date();
  lastUpdateTime.setTime(lastUpdatedAt);

  return (
    <div>
      <Modal show={showDelete} onHide={() => setShowDelete(false)}>
        <Modal.Header>Confirm</Modal.Header>
        <Modal.Body>
          <p>{`Are you sure you want to permanently delete '${title}'? There will be no way to recover this note.`}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant={'secondary'} onClick={() => setShowDelete(false)}>Close</Button>
          <Button variant={'danger'} onClick={async () => {
            await onDelete(key);

            setShowDelete(false);
          }}>Delete</Button>
        </Modal.Footer>
      </Modal>

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
                await onSave({ key, title, body });
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
            <Button variant={'outline-secondary'} onClick={() => onDuplicate(key)}>
              <FontAwesomeIcon icon={faCopy} />
            </Button>
          </ButtonGroup>
          <p className={'mb-0 mt-2'}><small>Last saved {lastUpdateTime.toLocaleString('en-US')}</small></p>
          <ButtonGroup>
            <Button
              variant={'outline-danger'}
              onClick={() => setShowDelete(true)}
            ><FontAwesomeIcon icon={faTrash} /></Button>
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
        onChange={() => {
          const contents = ref.current.getInstance().getMarkdown();
          if (body === contents) {
            return;
          }

          dispatchUpdateBody(contents);
        }}
      />
    </div>
  );
};

export default connect(
  state => ({
    draft: getDraft(state),
    isSaving: getNoteStatuses(state)[getActiveKey(state)] === noteStatus.saving,
  }),
  dispatch => ({
    dispatchUpdateTitle: title => dispatch(updateTitle(title)),
    dispatchUpdateBody: body => dispatch(updateBody(body)),
    dispatchNewDraftInternal: () => dispatch(newDraftUpdatedInternal()),
  }),
)(NoteEditor);
