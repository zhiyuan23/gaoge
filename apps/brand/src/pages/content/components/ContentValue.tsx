export default function ContentValue() {
  return (
    <section
      className="content-page-section content-closing mx-auto flex min-h-[72dvh] max-w-[1600px] items-center justify-center px-6 py-24 text-center md:px-10"
      data-testid="content-closing"
    >
      <h2
        aria-label="让一次被看见，成为持续发生的关系。"
        className="font-display-cn max-w-4xl text-5xl font-medium leading-[1.02] tracking-[-0.025em] text-white md:text-7xl"
      >
        <span className="content-closing-balanced-line">
          <span aria-hidden="true" className="content-closing-leading-balance">
            ，
          </span>
          让一次被看见，
        </span>
        <br />
        成为持续发生的关系。
      </h2>
    </section>
  )
}
