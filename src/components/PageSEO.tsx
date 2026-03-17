import { Helmet } from "react-helmet-async";

interface PageSEOProps {
  title: string;
  description: string;
  path?: string;
}

const PageSEO = ({ title, description, path = "" }: PageSEOProps) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    {path && <link rel="canonical" href={`https://singletape.in${path}`} />}
    {path && <meta property="og:url" content={`https://singletape.in${path}`} />}
  </Helmet>
);

export default PageSEO;
