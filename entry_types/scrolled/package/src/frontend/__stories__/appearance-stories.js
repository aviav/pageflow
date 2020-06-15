import React from 'react';

import {Entry, EntryStateProvider} from 'pageflow-scrolled/frontend';

import {
  normalizeAndMergeFixture,
  exampleHeading,
  exampleTextBlock,
  examplePositionedElement
} from 'pageflow-scrolled/spec/support/stories';

import {storiesOf} from '@storybook/react';

const appearanceOptions = ['shadow', 'transparent', 'cards'];
const positionOptions = {
  left: ['inline', 'sticky', 'full'],
  right: ['inline', 'sticky', 'full'],
  center: ['inline', 'left', 'right', 'full'],
}


appearanceOptions.forEach(appearance => {
  storiesOf(`Frontend/Section Appearance/${appearance}`, module)
    .add(
      'Layout/Position',
      () =>
        <EntryStateProvider seed={exampleSeed(appearance)}>
          <Entry />
        </EntryStateProvider>
    );
});

function exampleSeed(appearance) {
  const sectionBaseConfiguration = {
    appearance,
    transition: 'reveal',
    fullHeight: true
  };

  return normalizeAndMergeFixture({
    sections: [
      {
        id: 1,
        configuration: {
          ...sectionBaseConfiguration,
          layout: 'left',
          backdrop: {
            color: '#cad2c5'
          },
        }
      },
      {
        id: 2,
        configuration: {
          ...sectionBaseConfiguration,
          layout: 'center',
          backdrop: {
            color: '#84a98c'
          },
        }
      },
      {
        id: 3,
        configuration: {
          ...sectionBaseConfiguration,
          layout: 'right',
          backdrop: {
            color: '#52796f'
          },
        }
      },
      {
        id: 4,
        configuration: {
          ...sectionBaseConfiguration,
          fullHeight: false,
          backdrop: {
            color: '#000'
          },
        }
      }
    ],
    contentElements: [
      ...exampleContentElements(1, 'left'),
      ...exampleContentElements(2, 'center'),
      ...exampleContentElements(3, 'right'),
      examplePositionedElement({sectionId: 4, position: 'full'}),
    ]
  });

  function exampleContentElements(sectionId, layout) {
    return [
      exampleHeading({sectionId, text: `${appearance}/${layout}`}),

      ...positionOptions[layout].map(position => [
        examplePositionedElement({sectionId, position, caption: `Position ${position}`}),
        exampleTextBlock({sectionId}),
        exampleTextBlock({sectionId}),
      ]).flat()
    ];
  }
}
