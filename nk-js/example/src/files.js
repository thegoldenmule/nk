import { Button, FormControl, InputGroup, ListGroup, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faLock, faSearch } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { noteStatus } from './slices/nkSlice';

const FileBrowser = ({  files = [], activeNote, onCreateNote, onNoteSelected, }) => {
  // state
  const [isCreating, setIsCreating] = useState(false);

  // generate list items
  const listItems = [(
    <ListGroup.Item key={'__new__'}>
      <Button
        variant={'outline-success'}
        onClick={async () => {
          setIsCreating(true);
          await onCreateNote();
          setIsCreating(false);
        }}
      >
        {
          isCreating
            ? <Spinner
                as={'span'}
                animation={'border'}
                size={'sm'}
                role={'status'}
                aria-hidden={'true'}
              />
            : <span>+ New Note</span>
        }
      </Button>
    </ListGroup.Item>
  )];

  for (let i = 0, len = files.length; i < len; i++) {
    const { key, name, status } = files[i];

    let content;
    switch (status) {
      case noteStatus.error: {
        content = <FontAwesomeIcon icon={faExclamationTriangle}/>;
        break;
      }
      case noteStatus.loading: {
        content = <Spinner animation={'border'} size={'sm'} as={'span'}/>;
        break;
      }
      case noteStatus.unloaded: {
        content = <FontAwesomeIcon icon={faLock}/>;
        break;
      }
      default: {
        content = <span>{name}</span>;
        break;
      }
    }

    listItems.push(
      <ListGroup.Item
        key={i}
        active={activeNote === key}
        onClick={() => onNoteSelected(key)}
      >
        { content }
      </ListGroup.Item>
    );
  }

  return (
    <div>
      <div className={'pb-4'}>
        <InputGroup>
          <FormControl type={'text'} placeholder={'Search'} size={'lg'} />
          <InputGroup.Append>
            <Button variant={'outline-success'}><FontAwesomeIcon icon={faSearch} /></Button>
          </InputGroup.Append>
        </InputGroup>
      </div>

      <ListGroup>
        {listItems}
      </ListGroup>
    </div>
  );
};

export default FileBrowser;
