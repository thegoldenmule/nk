import { useEffect, useRef } from 'react';
import { Button, ButtonGroup, ButtonToolbar, Form, OverlayTrigger, Spinner, Tooltip } from 'react-bootstrap';
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

const NoteEditor = ({ onSave, isSaving, draft: { key, drafts, newDraft }, dispatchNewDraftInternal, dispatchUpdateTitle, dispatchUpdateBody }) => {
  const { title, body, lastUpdatedAt, } = drafts[key] || {};

  const ref = useRef(null);

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
          <p className={'mb-0 mt-2'}><small>Last saved {lastUpdateTime.toLocaleString('en-US')}</small></p>
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
    isSaving: getNoteStatuses(state)[getDraftKey(state)] === noteStatus.loading,
  }),
  dispatch => ({
    dispatchUpdateTitle: title => dispatch(updateTitle(title)),
    dispatchUpdateBody: body => dispatch(updateBody(body)),
    dispatchNewDraftInternal: () => dispatch(newDraftUpdatedInternal()),
  }),
)(NoteEditor);
