---
name: concatenated-component-tree
description: Structure a complex feature's components as a flat folder where every file name is its parent's name plus one section segment (`<feature>-<section>-<sub-section>.tsx`), so the file list reads as the component tree. Use when creating, splitting, or renaming components in a feature with many nested sub-components, both in new projects and when refactoring existing ones.
---

# Concatenated component tree

Make the component hierarchy readable from the file names alone, without deep folder nesting. Alphabetical sort groups each parent with its children, and each name tells you who renders the component.

Applies to new projects and to refactoring existing ones.

## Rules

1. **One folder per feature**: `src/components/<feature>/`, with every file starting with the feature prefix.
2. **Child = parent name + one segment**: a component rendered by `X.tsx` is named `X-<part>.tsx`.
3. **Stay flat**: only open a sub-folder when a section grows past about 6 files, and keep the full prefix on the files inside it.
4. **Shared pieces** used by several sections sit directly under the feature prefix (`<feature>-star-icon.tsx`).
5. **Non-components** go in `models/` or get a `utils` segment (`<feature>-utils-<name>.ts`).
6. **Renames cascade**: when a parent is renamed or moved, rename its children and update their imports.

## Segment order

Files are navigated in alphabetical order, so the order of sibling segments has some importance. When there is a free choice between segment names, pick ones that sort well:

- Let the more important parts sort to the top.
- For a large page or form, follow the page order instead (see the next section).

This is a preference, not a hard rule: a clear, accurate name always wins over one chosen only for its sort position.

## Large pages and forms

A very large page or form is read top to bottom, and so is its file list. Name the top-level sections so that they sort alphabetically in the same order they appear on the page. The folder then works as a table of contents: to find the code for something you see on screen, scroll the file list to the same relative position.

How to apply it:

1. List the page's sections in the order they are rendered, top to bottom.
2. Choose a segment name for each section so that the names sort in that same order. Usually there are several accurate names for a section (`Summary`, `Sikum`, `Closing`), so pick the one that lands in the right place.
3. Children inherit the position automatically, because they start with their section's name: everything under `MetaData` stays grouped with it, ahead of everything under `Objectives`.
4. Parts that are not a section of the page (bottom bar, dialogs, utilities) get their own segments such as `View` or `Utils`, which keeps them out of the section sequence.
5. When adding a new section later, pick a name that sorts into its place on the page rather than renaming the existing sections.

Do not force it with an inaccurate name: if no accurate name sorts correctly, keep the accurate name and either accept the section being out of order or, for long forms, use an explicit order marker (see "Order markers" below).

Example: the sections of the `modular-activity-edit` form sort in the same order they appear in the form:

```
ModularActivityFormMetaData.tsx                         1. metadata
ModularActivityFormMetaDataBrief.tsx                       (child of metadata)
ModularActivityFormMetaDataTopical.tsx                     (child of metadata)
ModularActivityFormObjectives.tsx                       2. objectives
ModularActivityFormObjectivesCompassCombobox.tsx           (child of objectives)
ModularActivityFormObjectivesConceptsCombobox.tsx          (child of objectives)
ModularActivityFormPrimaryContent.tsx                   3. primary content
ModularActivityFormPrimaryContentOpeningGame.tsx           (child of primary content)
ModularActivityFormResources.tsx                        4. resources
ModularActivityFormSikum.tsx                            5. summary
ModularActivityFormUtilsValidateMetaData.tsx            not a page section
ModularActivityFormViewBottomBar.tsx                    not a page section
```

### Order markers (numbers or letters)

Some forms have many sections whose natural names cannot sort in page order (a 13-section form, a multi-step wizard). This is an edge case, but in exactly these cases the order matters most: a person opening the folder has to find their way among a dozen or more sibling files, and without a visible order they must open files one by one to locate the section they see on screen. Here, put an explicit order marker in the name, right after the shared `Section` (or `Step`) segment and before the descriptive name:

- **Numbers** for long forms. Zero-pad them (`01`, `02`, ... `13`) so that `10` does not sort before `2`.
- **Letters** for shorter sequences (`A`, `B`, `C`, ...).

Keep the descriptive name after the marker; the marker gives the position, the name says what the section is. When a section is inserted or moved, renumber the following files so the markers stay true to the page.

Example with numbers, a 13-section event form:

```
form/
  EventForm.tsx
  EventFormMain.tsx
  EventFormMainHeder.tsx
  EventFormMainSections.tsx
  Section01GeneralInfo.tsx
  Section02EventTypeData.tsx
  Section03Commander.tsx
  Section04OperationalRear.tsx
  Section05AdditionalRoles.tsx
  Section06Pioneer.tsx
  Section07Activities.tsx
  Section08Accommodation.tsx
  Section09TripApproval.tsx
  Section10Transport.tsx
  Section11Medical.tsx
  Section12Security.tsx
  Section13FoodSupplier.tsx
```

(In new code keep the feature prefix on the sections as well: `EventFormSection01GeneralInfo.tsx`.)

Example with letters, a six-step purchase form:

```
purchase/
  PurchaseMain.tsx
  PurchaseMainFinish.tsx
  PurchaseMainFinishSummaryRow.tsx
  PurchaseMainForm.tsx
  PurchaseMainFormUtilNextBack.tsx
  PurchaseMainPreview.tsx
  PurchaseSection.tsx
  PurchaseSectionAOccasion.tsx
  PurchaseSectionBSum.tsx
  PurchaseSectionCReceiver.tsx
  PurchaseSectionDHow.tsx
  PurchaseSectionEWhen.tsx
  PurchaseSectionFWhat.tsx
  PurchaseSectionHeader.tsx
  PurchaseSectionMainFormBox.tsx
```

Use markers only for this case. A feature whose sections already sort naturally, or that has only a few sections, does not need them.

## Casing

Both kebab-case (`modular-activity-main-body.tsx`) and PascalCase (`ModularActivityFormMetaData.tsx`) are accepted.

- **Greenfield project or feature**: use kebab-case.
- **Existing folder**: match the casing already used there. Do not mix casings inside one feature folder, and do not recase files unless asked.

The exported component is PascalCase in both cases and mirrors the file name (`modular-activity-main-body.tsx` exports `ModularActivityMainBody`).

## Example

```
modular-activity/
  modular-activity-page.tsx
  modular-activity-main.tsx
  modular-activity-main-body.tsx
  modular-activity-main-body-header.tsx
  modular-activity-main-body-header-buttons.tsx
  modular-activity-main-body-goals.tsx
  modular-activity-main-body-goals-compass-main-message.tsx
  modular-activity-main-body-summary.tsx
  modular-activity-method-view.tsx
  modular-activity-method-view-content.tsx
  modular-activity-method-view-modal.tsx
  modular-activity-sidebar.tsx
  modular-activity-star-icon.tsx
  models/
```

`modular-activity-main-body-header-buttons.tsx` is rendered by `...-header`, which is rendered by `...-body`, which is rendered by `...-main`.

PascalCase equivalent with a sub-folder for a large section:

```
modular-activity-edit/
  ModularActivityForm.tsx
  ModularActivityFormMetaData.tsx
  ModularActivityFormMetaDataBrief.tsx
  ModularActivityFormMetaDataTopical.tsx
  ModularActivityMethodUnit/
    ModularActivityMethodUnitForm.tsx
    ModularActivityMethodUnitModal.tsx
```

## Refactoring an existing feature

1. Map the render tree from the feature's root component down.
2. Derive each file's new name from its parent's name plus one segment.
3. Rename with `git mv`, parents before children, and update imports and exported component names.
4. Run the project's lint, typecheck, and tests.
