# Runestone Web Components

This is an offshoot from RunestoneComponents with two primary goals:

1.  Turning the Runestone components into full Web Components. This will make it much easier for the interactive learning components to be integrated into other authoring systems -- like PreTeXt or even something written in markdown.

2.  Use webpack to consolidate the 100 little js files that have to be managed and included separately in each page into a single `runestone.js` file.

- [ ] assess
- [ ] clickableArea
- [ ] codelens
- [ ] datafile
- [ ] disqus
- [ ] dragndrop
- [ ] fitb
- [ ] lp
- [ ] matrixeq
- [ ] parsons
- [ ] poll
- [ ] question
- [ ] reveal
- [x] shortanswer
- [ ] showeval
- [ ] spreadsheet
- [ ] tabbedStuff
- [ ] video

Today, the runestone build command generates the following html for a short answer question.

```
<div class="runestone">
    <div data-component="shortanswer" class="journal alert alert-success" id=question1 data-optional>
        <p>Q-1: What are the colors in the rainbow?</p>
    </div>
</div>
```

When the page is loaded and all 100 of the js files have been loaded some javascript runs and looks for all divs that have the `data-component="shortanswer" tag.` The javascript then transforms the div into a nicer looking question.

The same directive could just as easily generate tags that look like this, where the javascript would register `shortanswer` as a custom tag and tell the browser how it should be rendered. The code won't have to change a ton, but this seems a lot cleaner and more reusable across more systems.

```
<shortanswer id=question1 class="runestone" optional>
   <question>What are the colors in the rainbow?</question>
</shortanswer>
```
