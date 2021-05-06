import { h, Fragment } from 'preact';
import styled, { createGlobalStyle } from 'styled-components';
import { Form } from '~/components/Form';

/* -------------------- DOM -------------------- */
type UiProps = {
  className?: string;
};

const Ui = (props: UiProps): h.JSX.Element => (
  <main className={props.className}>
    <h1>
      <span>静止画生成くん</span>
      <a href="https://github.com/Yama-Tomo/static-image-generate-boy" target="_blank">
        <img
          src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
          alt="github"
        />
      </a>
    </h1>
    <Form />
  </main>
);

/* ------------------- Style ------------------- */
const GlobalStyle = createGlobalStyle`
 body {
   box-sizing: border-box;
   margin: 0rem;
   background-color: rgb(252 252 252);
   font-family: "Roboto", "Helvetica", "Arial", sans-serif;
   color: #45515b;
 }
`;

const StyledUi = styled((props: UiProps) => (
  <Fragment>
    <GlobalStyle />
    <Ui {...props} />
  </Fragment>
))`
  margin: 1rem;

  h1 {
    display: flex;
    align-items: center;

    span {
      flex: 1;
    }

    img {
      width: 30px;
    }
  }
`;

/* --------------------------------------------- */
export { StyledUi as App };
