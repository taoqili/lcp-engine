import * as React from 'react';
import Ghost from './ghost';
import Panes from './panes';

export default function UI() {
  return (
    <div className='engine-main'>
      <Panes />
      <Ghost />
    </div>
  );
}
